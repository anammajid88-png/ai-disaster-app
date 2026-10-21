import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, Info, Navigation, Route as RouteIcon, ShieldAlert } from 'lucide-react';
import { SCENARIOS } from '../scenario/definitions';
import { stateAt, computePlan } from '../scenario/engine';
import { REGIONS } from '../data/regions';
import { getRoadGraph } from '../geo/data';
import { alternativeRoutes, LOCAL_TRIP_KM } from '../geo/graph';
import { haversineKm, segmentCrossesLines } from '../geo/geometry';
import { PakMap, Marker, GeoLine } from '../components/PakMap';
import { Card, Metric, ModeBadge, SectionTitle, Slider, Tabs } from '../components/primitives';

const ROUTE_COLORS = ['#0b5cab', '#0284c7', '#7c3aed'];
const FOOT_KMH = 4.5;

function fmtH(h) {
  if (!Number.isFinite(h)) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh ? `${hh} h ${mm} min` : `${mm} min`;
}

function adjust(r, from, to, state, transport) {
  if (!r.feasible) return r;
  let out = { ...r };
  if (
    r.method === 'estimated-local' &&
    haversineKm(from, to) < LOCAL_TRIP_KM &&
    state?.footprint?.kind === 'corridor' &&
    state.footprint.halfWidthKm >= 0.3 &&
    segmentCrossesLines(from, to, state.footprint.lines)
  ) {
    out = {
      ...out,
      km: out.km * 2.2,
      hours: out.hours * 2.2,
      note: `${out.note} Crosses flooded corridor → 2.2× detour.`,
    };
  }
  if (transport === 'foot') out = { ...out, hours: out.km / FOOT_KMH };
  return out;
}

export default function IntelligenceEvacuation() {
  const [scenarioId, setScenarioId] = useState('south-punjab-flood');
  const def = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const [hour, setHour] = useState(36);
  const [originId, setOriginId] = useState('k2');
  const [destId, setDestId] = useState('auto');
  const [transport, setTransport] = useState('vehicle');
  const [mobility, setMobility] = useState(false);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);

  const origins = useMemo(
    () => def.settlements.map((s) => ({ id: s.id, name: s.name, coord: s.coord })),
    [def]
  );
  const dests = useMemo(
    () => def.shelters.map((s) => ({ id: s.id, name: s.name, coord: s.coord })),
    [def]
  );

  const origin = origins.find((x) => x.id === originId) || origins[0];
  const state = useMemo(() => stateAt(def, def.defaults, hour), [def, hour]);
  const plan = useMemo(() => computePlan(def, def.defaults), [def]);
  const closed = useMemo(() => new Set(state?.closedEdges || []), [state]);
  const g = useMemo(() => getRoadGraph(), []);

  const result = useMemo(() => {
    const candidates =
      destId === 'auto'
        ? dests.filter((d) => !state?.floodedShelters?.includes(d.id) && d.id !== origin.id)
        : dests.filter((d) => d.id === destId);

    let best = null;
    const considered = [];

    for (const d of candidates) {
      const rawRoutes = alternativeRoutes(g, origin.coord, d.coord, closed, 3);
      const routes = rawRoutes.map((r) => adjust(r, origin.coord, d.coord, state, transport));
      const first = routes[0];
      const cap = plan?.shelters?.find((s) => s.shelter.id === d.id);
      const full = cap && cap.assigned >= cap.capacity;

      considered.push({
        d,
        hours: first.hours,
        feasible: first.feasible,
        km: first.km,
        reason: !first.feasible ? 'Route impassable due to flood water' : full ? 'Shelter at full capacity' : 'Open',
      });

      if (first.feasible && !(destId === 'auto' && full) && (!best || first.hours < best.routes[0].hours)) {
        best = { d, routes };
      }
    }
    return { best, considered: considered.sort((a, b) => a.hours - b.hours) };
  }, [origin, destId, dests, g, closed, state, transport, plan]);

  const candidateRoutes = result.best?.routes || [];
  const activeRoute = candidateRoutes[selectedRouteIdx] || candidateRoutes[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="Graph-Theoretic Evacuation Engine"
        title="Evacuation Routing & Road Closure Avoidance"
      >
        Dijkstra shortest-path routing over Pakistan's Natural Earth road network (4,251 nodes, 4,307 edges) with penalty-method alternatives and dynamic flood water closures.
      </SectionTitle>

      {/* Safety Notice */}
      <div className="intel-notice intel-notice--caution">
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Safety & Navigation Disclaimer:</strong> This routing engine is a public academic model. Road geometries are generalized, and closures are simulated. This tool is not intended for real-time life-safety navigation. Always follow official evacuation corridors and instructions designated by Rescue 1122 and the district administration.
        </div>
      </div>

      {/* Main Grid: Trip Planner (Left) + Interactive Map (Right) */}
      <div className="intel-grid intel-grid--split">
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Evacuation Trip Parameters" mode="simulated">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }}>
                  Scenario Context:
                </label>
                <select
                  value={scenarioId}
                  onChange={(e) => {
                    setScenarioId(e.target.value);
                    const d = SCENARIOS.find((s) => s.id === e.target.value);
                    if (d) {
                      setOriginId(d.settlements[0].id);
                      setDestId('auto');
                      setSelectedRouteIdx(0);
                    }
                  }}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  {SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }}>
                  Origin Settlement (At-Risk Area):
                </label>
                <select
                  value={origin.id}
                  onChange={(e) => {
                    setOriginId(e.target.value);
                    setSelectedRouteIdx(0);
                  }}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  {origins.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }}>
                  Target Destination / Relief Shelter:
                </label>
                <select
                  value={destId}
                  onChange={(e) => {
                    setDestId(e.target.value);
                    setSelectedRouteIdx(0);
                  }}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="auto">Auto-assign optimal open shelter</option>
                  {dests.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }}>
                  Transport Mode:
                </label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="vehicle">Standard Rescue Vehicle (Highway 70 / Local 45 km/h)</option>
                  <option value="ambulance">Emergency Ambulance (Priority Transit)</option>
                  <option value="foot">Foot Evacuation (4.5 km/h)</option>
                </select>
              </div>

              <Slider
                label="Timeline Hour"
                value={hour}
                min={0}
                max={def.durationH}
                step={1}
                unit="h"
                help="Road closures and inundation footprint evolve over time"
                onChange={setHour}
              />
            </div>
          </Card>

          {/* Computed Candidate Routes Card */}
          <Card
            title="Candidate Evacuation Routes"
            subtitle={result.best?.d ? `To: ${result.best.d.name}` : 'Searching open routes...'}
            mode="simulated"
          >
            {candidateRoutes.length > 0 && candidateRoutes[0].feasible ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {candidateRoutes.map((r, idx) => {
                  const isSelected = idx === selectedRouteIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedRouteIdx(idx)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? `2px solid ${ROUTE_COLORS[idx]}` : '1px solid var(--border)',
                        background: isSelected ? 'var(--surface-3)' : 'var(--surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: ROUTE_COLORS[idx], fontSize: '0.875rem' }}>
                          {idx === 0 ? 'Primary Safe Corridor (Fastest)' : `Alternative Corridor ${idx + 1}`}
                        </strong>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>
                          {fmtH(r.hours)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', gap: '0.75rem' }}>
                        <span>Distance: {Math.round(r.km)} km</span>
                        <span>Graph Nodes: {r.coords.length}</span>
                        <span>Routing: {r.method}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--critical)', margin: 0 }}>
                No open road route available under current inundation closures. Watercraft transit required to reach safe roadhead.
              </p>
            )}
          </Card>
        </div>

        {/* Map Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Active Route Metrics Bar */}
          {activeRoute && activeRoute.feasible && (
            <div className="intel-grid intel-grid--3">
              <Metric
                label="Transit Duration"
                value={fmtH(activeRoute.hours)}
                mode="simulated"
                hint={`At mode: ${transport}`}
                tone="accent"
              />
              <Metric
                label="Road Distance"
                value={`${Math.round(activeRoute.km)} km`}
                mode="simulated"
                hint="Dijkstra weighted path"
              />
              <Metric
                label="Active Closures Avoided"
                value={closed.size}
                mode="simulated"
                hint="Dynamic flood edges bypass"
              />
            </div>
          )}

          {/* Interactive Routing Map */}
          <div style={{ height: 500, position: 'relative' }}>
            <PakMap
              view={{ center: def.view.center, zoom: def.view.zoom }}
              layers={{ provinces: true, rivers: true, roads: true, labels: true }}
              closedEdges={state?.closedEdges}
              overlay={
                <g>
                  {candidateRoutes.map((r, idx) => (
                    <GeoLine
                      key={idx}
                      coords={r.coords}
                      color={ROUTE_COLORS[idx]}
                      widthPx={idx === selectedRouteIdx ? 4 : 2}
                      opacity={idx === selectedRouteIdx ? 1 : 0.6}
                    />
                  ))}
                </g>
              }
              screenOverlay={
                <g>
                  {/* Origin */}
                  <Marker
                    at={origin.coord}
                    r={9}
                    color="#ea580c"
                    pulse
                    priority="high"
                    label={`Origin: ${origin.name}`}
                    text={origin.name}
                    labelPosition="right"
                    showLabel
                  />
                  {/* Shelters */}
                  {dests.map((d) => (
                    <Marker
                      key={d.id}
                      at={d.coord}
                      r={7}
                      shape="square"
                      color={d.id === result.best?.d?.id ? '#16a34a' : '#64748b'}
                      priority={d.id === result.best?.d?.id ? 'high' : 'normal'}
                      label={`Shelter: ${d.name}`}
                      text={d.name}
                      labelPosition="bottom"
                      showLabel={d.id === result.best?.d?.id}
                      onSelect={() => {
                        setDestId(d.id);
                        setSelectedRouteIdx(0);
                      }}
                    />
                  ))}
                </g>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
