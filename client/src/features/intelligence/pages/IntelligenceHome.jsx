import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  Layers,
  MapPin,
  Route,
  ShieldAlert,
  Sliders,
  Truck,
} from 'lucide-react';
import { assessAll, HAZARD_LABELS } from '../risk/engine';
import { REGIONS, regionById } from '../data/regions';
import { HISTORICAL_EVENTS } from '../data/historical';
import { DEFAULT_SCENARIO } from '../scenario/definitions';
import { computePlan } from '../scenario/engine';
import { PakMap, Marker } from '../components/PakMap';
import { Card, Metric, ModeBadge, RiskBadge, SectionTitle, Tabs, Toggle } from '../components/primitives';

const HAZARDS = ['flood', 'urban_flood', 'earthquake', 'heatwave', 'landslide'];

export default function IntelligenceHome() {
  const [hazard, setHazard] = useState('flood');
  const [selectedRegionId, setSelectedRegionId] = useState('muzaffargarh');
  const [showQuakes, setShowQuakes] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const list = useMemo(() => assessAll(hazard, {}), [hazard]);
  const focus = useMemo(
    () => list.find((a) => a.regionId === selectedRegionId) || list[0],
    [list, selectedRegionId]
  );
  const elevated = useMemo(
    () => list.filter((a) => a.riskBand === 'critical' || a.riskBand === 'high'),
    [list]
  );
  const plan = useMemo(
    () => computePlan(DEFAULT_SCENARIO, DEFAULT_SCENARIO.defaults),
    []
  );

  const focusRegion = regionById(focus?.regionId || 'muzaffargarh');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="National Intelligence Command"
        title="Disaster Intelligence Overview"
      >
        Predictive screening, explainable multi-hazard risk indices, and deterministic response planning for Pakistan. Designed using the student application's blue-and-white design system.
      </SectionTitle>

      {/* Top 4 Metrics Summary */}
      <div className="intel-grid intel-grid--4">
        <Metric
          label={`Elevated Risk (${HAZARD_LABELS[hazard]})`}
          value={`${elevated.length} / ${list.length}`}
          mode="estimated"
          hint="Districts screening in High or Critical band"
          tone={elevated.length ? 'critical' : 'default'}
        />
        <Metric
          label="M4+ Seismic Monitor (USGS)"
          value="14"
          mode="sample"
          hint="Sample benchmark — events within Pakistan bounding box (30 days)"
        />
        <Metric
          label="Precipitation Watch (Open-Meteo)"
          value="78"
          unit="mm"
          mode="sample"
          hint="Sample benchmark — peak 3-day forecast in monitored districts"
        />
        <Metric
          label="Flagship Scenario Readiness"
          value={plan.readiness.score}
          unit="/100"
          mode="simulated"
          hint={`Coverage ${plan.metrics.coveragePct}% (${plan.metrics.unmet.toLocaleString()} unmet)`}
          tone={plan.readiness.score >= 70 ? 'ok' : 'caution'}
        />
      </div>

      {/* Main Split: Interactive Map & Details */}
      <div className="intel-grid intel-grid--split">
        {/* Left: Map & Hazard Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Tabs
              label="Hazard Selector"
              value={hazard}
              onChange={setHazard}
              tabs={HAZARDS.map((h) => ({ value: h, label: HAZARD_LABELS[h] }))}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Toggle label="Earthquakes" checked={showQuakes} onChange={setShowQuakes} />
              <Toggle label="History" checked={showHistory} onChange={setShowHistory} />
            </div>
          </div>

          <div style={{ height: 420, position: 'relative' }}>
            <PakMap
              view={focusRegion ? { center: focusRegion.coord, zoom: 6.2 } : { center: [69.6, 30.2], zoom: 5.2 }}
              ariaLabel="National risk map"
              screenOverlay={
                <g>
                  {showHistory &&
                    HISTORICAL_EVENTS.map((e) => (
                      <Marker
                        key={e.id}
                        at={e.coord}
                        r={6}
                        shape="diamond"
                        color="#0284c7"
                        label={`${e.title} (${e.date.slice(0, 4)})`}
                      />
                    ))}
                  {showQuakes && (
                    <Marker
                      at={[67.0, 30.2]}
                      r={9}
                      shape="circle"
                      color="#dc2626"
                      pulse
                      label="M5.1 — Quetta seismic cluster"
                    />
                  )}
                  {list.map((a) => {
                    const reg = regionById(a.regionId);
                    if (!reg) return null;
                    const isCrit = a.riskBand === 'critical';
                    const color = isCrit
                      ? '#b91c1c'
                      : a.riskBand === 'high'
                      ? '#ea580c'
                      : a.riskBand === 'moderate'
                      ? '#d97706'
                      : '#16a34a';

                    return (
                      <Marker
                        key={a.regionId}
                        at={reg.coord}
                        r={a.riskId === selectedRegionId ? 9 : 6 + a.riskScore / 18}
                        color={color}
                        pulse={isCrit}
                        selected={a.regionId === selectedRegionId}
                        label={`${reg.name}: ${a.riskBand} (${a.riskScore})`}
                        showLabel={a.riskScore >= 60 || a.regionId === selectedRegionId}
                        onSelect={() => setSelectedRegionId(a.regionId)}
                      />
                    );
                  })}
                </g>
              }
            />
          </div>

          {/* District Factor Card */}
          {focus && focusRegion && (
            <Card
              title={`${focusRegion.name} (${focusRegion.province}) — ${HAZARD_LABELS[hazard]}`}
              subtitle="Analytical multi-hazard factor breakdown"
              mode="estimated"
              actions={<RiskBadge band={focus.riskBand} score={focus.riskScore} />}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {focus.factors.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>{f.name}</span>
                      <ModeBadge mode={f.mode} />
                    </div>
                    <div style={{ marginTop: '0.25rem', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {f.score} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)' }}>/ 10</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{f.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Regional Ranking & Action Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            title="Highest Risk Districts"
            subtitle="Sorted by relative multi-hazard screening index"
            mode="estimated"
            actions={
              <Link to="/intelligence/risk" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                View All →
              </Link>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {list.slice(0, 7).map((a) => {
                const r = regionById(a.regionId);
                const isSelected = a.regionId === selectedRegionId;
                return (
                  <button
                    key={a.regionId}
                    type="button"
                    onClick={() => setSelectedRegionId(a.regionId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--surface-3)' : 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', width: 28 }}>
                        {a.riskScore}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>
                        {r?.name}
                      </span>
                    </div>
                    <RiskBadge band={a.riskBand} />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Guided Capabilities Card */}
          <Card
            title="Advanced Intelligence Modules"
            subtitle="Explore specialized decision-support tools"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Link
                to="/intelligence/simulator"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sliders size={20} color="var(--accent)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>Disaster Simulator</strong>
                    <small style={{ color: 'var(--muted)' }}>3 scenarios, time scrubber, A/B comparison</small>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--muted)" />
              </Link>

              <Link
                to="/intelligence/evacuation"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Route size={20} color="var(--accent)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>Evacuation Planner</strong>
                    <small style={{ color: 'var(--muted)' }}>Dijkstra graph router with road closure avoidance</small>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--muted)" />
              </Link>

              <Link
                to="/intelligence/resources"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Truck size={20} color="var(--accent)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>Resource Coordination</strong>
                    <small style={{ color: 'var(--muted)' }}>Simulated rescue dispatch and shelter optimization</small>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--muted)" />
              </Link>

              <Link
                to="/intelligence/demo"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--blue-100) 0%, var(--surface-2) 100%)',
                  border: '1px solid var(--blue-300)',
                  textDecoration: 'none',
                  color: 'var(--blue-900)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={20} color="var(--blue-700)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>9-Step Judge Showcase</strong>
                    <small style={{ color: 'var(--blue-800)' }}>Presenter guided walkthrough for Islamabad finals</small>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--blue-700)" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
