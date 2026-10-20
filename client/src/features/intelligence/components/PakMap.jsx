import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import { GEO_BASE, getRoadGraph } from '../geo/data';
import { cx } from './primitives';

const MapCtx = createContext(null);
export const useMap = () => {
  const ctx = useContext(MapCtx);
  if (!ctx) throw new Error('useMap must be used inside <PakMap>');
  return ctx;
};

const BASE_ZOOM = 5.2;
const PROVINCE_LABEL_MIN_K = { 'Islamabad Capital Territory': 9, 'Azad Jammu & Kashmir': 2.2 };
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function PakMap({
  view,
  layers = { provinces: true, rivers: true, roads: false, labels: true },
  overlay,
  screenOverlay,
  className = '',
  ariaLabel = 'Map of Pakistan',
  closedEdges,
  minHeight = 360,
  controls = true,
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [t, setT] = useState(zoomIdentity);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width: Math.round(width), height: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const projection = useMemo(
    () => geoMercator().fitExtent([[12, 12], [size.width - 12, size.height - 12]], { type: 'FeatureCollection', features: GEO_BASE.country }),
    [size.width, size.height],
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

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const z = d3zoom()
      .scaleExtent([0.8, 120])
      .on('zoom', (ev) => setT(ev.transform));
    zoomRef.current = z;
    select(svg).call(z).on('dblclick.zoom', null);
    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);

  const transformFor = useCallback(
    (v) => {
      const k = Math.pow(2, v.zoom - BASE_ZOOM);
      const pt = projection(v.center);
      if (!pt) return zoomIdentity;
      const [x, y] = pt;
      return zoomIdentity.translate(size.width / 2 - x * k, size.height / 2 - y * k).scale(k);
    },
    [projection, size.width, size.height],
  );

  const animateTo = useCallback(
    (target) => {
      const svg = svgRef.current;
      const z = zoomRef.current;
      if (!svg || !z) return;
      const sel = select(svg);
      if (prefersReducedMotion()) {
        z.transform(sel, target);
        return;
      }
      const from = { ...t };
      const start = performance.now();
      const dur = 750;
      let raf = 0;
      const step = (now) => {
        const u = Math.min(1, (now - start) / dur);
        const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        const k = from.k * Math.pow(target.k / from.k, e);
        const x = from.x + (target.x - from.x) * e;
        const y = from.y + (target.y - from.y) * e;
        z.transform(sel, zoomIdentity.translate(x, y).scale(k));
        if (u < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    },
    [t],
  );

  const viewKey = view ? `${view.center.join(',')}@${view.zoom}` : 'none';
  const sizeKey = `${size.width}x${size.height}`;
  const placed = useRef(false);
  const prevView = useRef(viewKey);
  useEffect(() => {
    if (!view) return;
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    const target = transformFor(view);
    if (!placed.current || prevView.current === viewKey) {
      zoomRef.current.transform(select(svg), target);
      placed.current = true;
    } else {
      animateTo(target);
    }
    prevView.current = viewKey;
  }, [viewKey, sizeKey, transformFor, animateTo, view]);

  const zoomBy = (factor) => {
    const svg = svgRef.current;
    if (svg && zoomRef.current) zoomRef.current.scaleBy(select(svg), factor);
  };
  const reset = () => animateTo(view ? transformFor(view) : zoomIdentity);

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

  const showProvinceLabels = layers.labels && t.k < 3.5 && size.width > 420;

  return (
    <div ref={wrapRef} className={cx('map-viewport', className)} style={{ minHeight }}>
      <svg ref={svgRef} width={size.width} height={size.height} style={{ display: 'block', cursor: 'grab' }} role="img" aria-label={ariaLabel}>
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
        <div className="map-controls">
          <button type="button" className="map-btn" title="Zoom in" onClick={() => zoomBy(1.5)}>
            <Plus size={16} />
          </button>
          <button type="button" className="map-btn" title="Zoom out" onClick={() => zoomBy(1 / 1.5)}>
            <Minus size={16} />
          </button>
          <button type="button" className="map-btn" title="Reset view" onClick={reset}>
            <LocateFixed size={16} />
          </button>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 4, left: 8, fontSize: '0.6875rem', color: 'var(--muted)', pointerEvents: 'none' }}>
        Map data: Natural Earth 1:10m (Public domain). Boundaries are indicative.
      </div>
    </div>
  );
}

export function Marker({ at, r = 6, color = 'var(--accent)', label = '', text, onSelect, selected = false, pulse = false, shape = 'circle', showLabel = false, children }) {
  const map = useMap();
  const [x, y] = map.toScreen(at);
  if (x < -40 || y < -40 || x > map.width + 40 || y > map.height + 40) return null;

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
      {showLabel && (
        <text
          x={r + 4}
          y={4}
          style={{
            pointerEvents: 'none',
            fill: 'var(--text)',
            fontSize: '11px',
            fontWeight: 600,
            paintOrder: 'stroke',
            stroke: '#ffffff',
            strokeWidth: 3,
            strokeLinejoin: 'round'
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
        .join(''),
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
