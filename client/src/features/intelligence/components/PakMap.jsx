import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { Minus, Plus, LocateFixed, Globe2 } from 'lucide-react';
import { GEO_BASE, getRoadGraph } from '../geo/data';
import { cx } from './primitives';

const MapCtx = createContext(null);
export const useMap = () => {
  const ctx = useContext(MapCtx);
  if (!ctx) throw new Error('useMap must be used inside <PakMap>');
  return ctx;
};

const BASE_ZOOM = 5.2;
const MIN_SCALE = 0.7;
const MAX_SCALE = 12.0;
const PROVINCE_LABEL_MIN_K = { 'Islamabad Capital Territory': 4.5, 'Azad Jammu & Kashmir': 2.0 };
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function PakMap({
  view,
  layers = { provinces: true, rivers: true, roads: false, labels: true },
  overlay,
  screenOverlay,
  className = '',
  ariaLabel = 'Interactive Map of Pakistan (Use +/- to zoom, arrow keys to pan, 0 to reset)',
  closedEdges,
  minHeight = 380,
  controls = true,
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 500 });
  const [t, setT] = useState(zoomIdentity);
  const tRef = useRef(zoomIdentity);
  const isDraggingRef = useRef(false);

  // ResizeObserver with threshold to avoid thrashing
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setSize((prev) => {
          if (Math.abs(prev.width - width) < 2 && Math.abs(prev.height - height) < 2) {
            return prev;
          }
          return { width: Math.round(width), height: Math.round(height) };
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Standard Natural Earth projection fitted to container size
  const projection = useMemo(
    () =>
      geoMercator().fitExtent(
        [
          [16, 16],
          [Math.max(100, size.width - 16), Math.max(100, size.height - 16)],
        ],
        { type: 'FeatureCollection', features: GEO_BASE.country }
      ),
    [size.width, size.height]
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const base = useMemo(() => {
    const p = (g) => path(g) ?? '';
    return {
      neighbours: GEO_BASE.neighbours.map((f) => ({ id: f.properties.ADM0_A3, d: p(f) })),
      country: GEO_BASE.country.map((f) => p(f)).join(' '),
      provinces: GEO_BASE.provinces.map((f) => ({ name: f.properties.name, d: p(f), c: path.centroid(f) })),
      rivers: GEO_BASE.rivers.map((f) => ({ name: f.properties.name, d: p(f) })),
    };
  }, [path]);

  const roads = useMemo(() => {
    if (!layers.roads) return null;
    const g = getRoadGraph();
    let major = '';
    let minor = '';
    for (const e of g.edges) {
      const a = projection(g.nodes[e.a]);
      const b = projection(g.nodes[e.b]);
      if (!a || !b) continue;
      const seg = `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
      if (e.cls === 1) major += seg;
      else minor += seg;
    }
    return { major, minor };
  }, [layers.roads, projection]);

  const closedPath = useMemo(() => {
    if (!closedEdges?.length) return '';
    const g = getRoadGraph();
    return closedEdges
      .map((e) => {
        const edge = g.edges[e];
        if (!edge) return '';
        const a = projection(g.nodes[edge.a]);
        const b = projection(g.nodes[edge.b]);
        if (!a || !b) return '';
        return `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
      })
      .join('');
  }, [closedEdges, projection]);

  // Transform calculation for a given view center & zoom
  const transformFor = useCallback(
    (v) => {
      if (!v || !v.center) return zoomIdentity;
      const k = Math.pow(2, v.zoom - BASE_ZOOM);
      const pt = projection(v.center);
      if (!pt) return zoomIdentity;
      const [x, y] = pt;
      return zoomIdentity.translate(size.width / 2 - x * k, size.height / 2 - y * k).scale(k);
    },
    [projection, size.width, size.height]
  );

  // Initialize D3 zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const z = d3zoom()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on('start', () => {
        isDraggingRef.current = true;
      })
      .on('zoom', (ev) => {
        tRef.current = ev.transform;
        setT(ev.transform);
      })
      .on('end', () => {
        isDraggingRef.current = false;
      });

    zoomRef.current = z;
    const sel = select(svg);
    sel.call(z).on('dblclick.zoom', null);

    return () => {
      sel.on('.zoom', null);
    };
  }, []);

  // Update zoom when view prop changes to a DIFFERENT view
  const prevViewKeyRef = useRef('');
  const initialPlacedRef = useRef(false);
  const viewKey = view ? `${view.center.join(',')}@${view.zoom}` : 'none';

  useEffect(() => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;

    if (!view) {
      if (!initialPlacedRef.current) {
        z.transform(select(svg), zoomIdentity);
        initialPlacedRef.current = true;
      }
      return;
    }

    // Only update if viewKey has genuinely changed or on initial mount
    if (viewKey !== prevViewKeyRef.current || !initialPlacedRef.current) {
      const target = transformFor(view);
      const sel = select(svg);

      if (!initialPlacedRef.current || prefersReducedMotion()) {
        z.transform(sel, target);
      } else {
        // Smoothly animate to newly selected scenario / view
        sel.transition().duration(650).call(z.transform, target);
      }

      initialPlacedRef.current = true;
      prevViewKeyRef.current = viewKey;
    }
  }, [viewKey, transformFor, view]);

  // Zoom helpers
  const zoomBy = useCallback((factor) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const sel = select(svg);
    if (prefersReducedMotion()) {
      z.scaleBy(sel, factor);
    } else {
      sel.transition().duration(250).call(z.scaleBy, factor);
    }
  }, []);

  const panBy = useCallback((dx, dy) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const current = tRef.current;
    const next = zoomIdentity.translate(current.x + dx, current.y + dy).scale(current.k);
    const sel = select(svg);
    if (prefersReducedMotion()) {
      z.transform(sel, next);
    } else {
      sel.transition().duration(150).call(z.transform, next);
    }
  }, []);

  const resetToScenario = useCallback(() => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const target = view ? transformFor(view) : zoomIdentity;
    const sel = select(svg);
    if (prefersReducedMotion()) {
      z.transform(sel, target);
    } else {
      sel.transition().duration(400).call(z.transform, target);
    }
  }, [view, transformFor]);

  const fitToPakistan = useCallback(() => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const sel = select(svg);
    if (prefersReducedMotion()) {
      z.transform(sel, zoomIdentity);
    } else {
      sel.transition().duration(400).call(z.transform, zoomIdentity);
    }
  }, []);

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e) => {
      if (e.target !== wrapRef.current && e.target !== svgRef.current) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomBy(1.35);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomBy(1 / 1.35);
      } else if (e.key === '0') {
        e.preventDefault();
        resetToScenario();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        panBy(50, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        panBy(-50, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        panBy(0, 50);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        panBy(0, -50);
      }
    },
    [zoomBy, panBy, resetToScenario]
  );

  const api = useMemo(() => {
    const kmRef = (at) => {
      const a = projection(at);
      const b = projection([at[0], at[1] + 0.1]);
      if (!a || !b) return 1;
      return Math.abs(b[1] - a[1]) / 11.0574;
    };
    return {
      project: (p) => projection(p) || [0, 0],
      toScreen: (p) => {
        const pt = projection(p);
        return pt ? t.apply(pt) : [0, 0];
      },
      path: (g) => path(g) ?? '',
      pxPerKm: kmRef,
      k: t.k,
      width: size.width,
      height: size.height,
    };
  }, [projection, path, t, size.width, size.height]);

  const showProvinceLabels = layers.labels && t.k < 3.2 && size.width > 420;
  const isZoomInDisabled = t.k >= MAX_SCALE - 0.1;
  const isZoomOutDisabled = t.k <= MIN_SCALE + 0.05;

  return (
    <div
      ref={wrapRef}
      className={cx('map-viewport', className)}
      style={{ minHeight, position: 'relative', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel}
    >
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        style={{ display: 'block', cursor: isDraggingRef.current ? 'grabbing' : 'grab', userSelect: 'none' }}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <pattern id="pak-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--critical, #c62828)" strokeWidth="1.2" strokeOpacity="0.55" />
          </pattern>
        </defs>
        <MapCtx.Provider value={api}>
          <g transform={t.toString()}>
            <rect x={-5000} y={-5000} width={12000} height={12000} fill="var(--map-neighbour, #f8fafc)" />
            {base.neighbours.map((n) => (
              <path key={n.id} d={n.d} fill="var(--bg-2, #f2f8fe)" stroke="var(--border, #d3dbe6)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={base.country} fill="var(--map-land, #ebf3fa)" stroke="var(--map-border, #8ba2be)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            {layers.provinces &&
              base.provinces.map((p) => (
                <path
                  key={p.name}
                  d={p.d}
                  fill="var(--map-land, #ebf3fa)"
                  stroke="var(--map-border, #8ba2be)"
                  strokeOpacity={0.7}
                  strokeWidth={0.8}
                  strokeDasharray="3 2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            {roads && (
              <>
                <path d={roads.minor} fill="none" stroke="var(--map-road, #cbd5e1)" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
                <path d={roads.major} fill="none" stroke="var(--map-road-major, #64748b)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              </>
            )}
            {layers.rivers &&
              base.rivers.map((r) => (
                <path key={r.name} d={r.d} fill="none" stroke="var(--map-river, #0284c7)" strokeOpacity={0.85} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              ))}
            {closedPath && <path d={closedPath} fill="none" stroke="var(--critical, #c62828)" strokeWidth={2.8} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
            {overlay}
          </g>

          {showProvinceLabels && (
            <g pointerEvents="none">
              {base.provinces.map((p) => {
                if (!p.c || !Number.isFinite(p.c[0])) return null;
                if ((PROVINCE_LABEL_MIN_K[p.name] ?? 0) > t.k) return null;
                const pt = t.apply(p.c);
                return (
                  <text
                    key={p.name}
                    x={pt[0]}
                    y={pt[1]}
                    textAnchor="middle"
                    style={{ fill: 'var(--muted, #6b7c94)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}
                  >
                    {p.name}
                  </text>
                );
              })}
            </g>
          )}

          {screenOverlay}
        </MapCtx.Provider>
      </svg>

      {controls && (
        <div className="map-controls" role="toolbar" aria-label="Map viewport controls">
          <button
            type="button"
            className="map-btn"
            title="Zoom in (Keyboard: +)"
            aria-label="Zoom in"
            disabled={isZoomInDisabled}
            onClick={() => zoomBy(1.4)}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="map-btn"
            title="Zoom out (Keyboard: -)"
            aria-label="Zoom out"
            disabled={isZoomOutDisabled}
            onClick={() => zoomBy(1 / 1.4)}
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            className="map-btn"
            title="Reset to scenario focus (Keyboard: 0)"
            aria-label="Reset to scenario focus"
            onClick={resetToScenario}
          >
            <LocateFixed size={18} />
          </button>
          <button
            type="button"
            className="map-btn"
            title="Fit to entire Pakistan"
            aria-label="Fit to entire Pakistan"
            onClick={fitToPakistan}
          >
            <Globe2 size={18} />
          </button>
          <div className="map-zoom-readout" aria-live="polite" title={`Current map scale: ${t.k.toFixed(1)}x`}>
            {t.k.toFixed(1)}x
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 4, left: 8, fontSize: '0.6875rem', color: 'var(--muted)', pointerEvents: 'none', background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 4 }}>
        Natural Earth 1:10m (Demonstration vectors). Use controls or mouse wheel to zoom.
      </div>
    </div>
  );
}

export function Marker({
  at,
  r = 6,
  color = 'var(--accent)',
  label = '',
  text,
  onSelect,
  selected = false,
  pulse = false,
  shape = 'circle',
  showLabel = false,
  priority = 'normal', // 'high' | 'normal' | 'low'
  labelPosition = 'right', // 'right' | 'bottom' | 'top'
  children,
}) {
  const map = useMap();
  const [x, y] = map.toScreen(at);
  if (x < -60 || y < -60 || x > map.width + 60 || y > map.height + 60) return null;

  // Decluttering logic based on zoom level:
  // - At low zoom (k < 1.6), only high priority or pulse/selected markers show text
  // - At mid zoom (k >= 1.6), normal markers show text
  // - At high zoom (k >= 2.5), all markers show text
  const shouldRenderLabel =
    showLabel &&
    (selected ||
      pulse ||
      priority === 'high' ||
      map.k >= 2.4 ||
      (priority === 'normal' && map.k >= 1.5));

  const common = { fill: color, stroke: selected ? 'var(--text)' : '#ffffff', strokeWidth: selected ? 2.5 : 1.5 };
  const shapeEl =
    shape === 'square' ? (
      <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={2} {...common} />
    ) : shape === 'diamond' ? (
      <rect x={-r * 0.85} y={-r * 0.85} width={1.7 * r} height={1.7 * r} transform="rotate(45)" {...common} />
    ) : shape === 'triangle' ? (
      <path d={`M0,${-r * 1.2}L${r * 1.1},${r * 0.8}L${-r * 1.1},${r * 0.8}Z`} {...common} />
    ) : (
      <circle r={r} {...common} />
    );

  const labelX = labelPosition === 'bottom' ? 0 : r + 5;
  const labelY = labelPosition === 'bottom' ? r + 13 : labelPosition === 'top' ? -r - 5 : 4;
  const labelAnchor = labelPosition === 'bottom' || labelPosition === 'top' ? 'middle' : 'start';

  return (
    <g
      transform={`translate(${x},${y})`}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={label}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <title>{label}</title>
      {pulse && <circle r={r * 1.8} fill={color} opacity={0.35} />}
      {shapeEl}
      {children}
      {shouldRenderLabel && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={labelAnchor}
          style={{
            pointerEvents: 'none',
            fill: 'var(--text, #1d2d3d)',
            fontSize: '11px',
            fontWeight: selected || pulse ? 700 : 600,
            paintOrder: 'stroke',
            stroke: '#ffffff',
            strokeWidth: 3,
            strokeLinejoin: 'round',
            fontFamily: 'inherit',
          }}
        >
          {text ?? label}
        </text>
      )}
    </g>
  );
}

export function GeoLine({ coords, lines, color = 'var(--accent)', widthPx = 2, widthKm, dash, opacity = 1 }) {
  const map = useMap();
  const all = lines ?? (coords ? [coords] : []);
  const d = all
    .map((l) =>
      l
        .map((p, i) => {
          const pt = map.project(p);
          return `${i ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
        })
        .join('')
    )
    .join('');
  if (!d) return null;

  if (widthKm !== undefined) {
    const ref = all[0]?.[0];
    const w = ref ? 2 * widthKm * map.pxPerKm(ref) : 0;
    return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={widthPx} strokeDasharray={dash} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
}

export function GeoCircle({ at, radiusKm, fill, stroke, opacity = 1 }) {
  const map = useMap();
  const pt = map.project(at);
  return <circle cx={pt[0]} cy={pt[1]} r={radiusKm * map.pxPerKm(at)} fill={fill} stroke={stroke} vectorEffect="non-scaling-stroke" opacity={opacity} />;
}
