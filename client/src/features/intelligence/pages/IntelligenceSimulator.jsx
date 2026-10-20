import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Users,
} from 'lucide-react';
import { SCENARIOS, scenarioById } from '../scenario/definitions';
import { computePlan, hazardAt, stateAt } from '../scenario/engine';
import { PakMap, Marker, GeoLine, GeoCircle } from '../components/PakMap';
import { Card, Metric, ModeBadge, SectionTitle, Slider, Tabs, Toggle } from '../components/primitives';

export default function IntelligenceSimulator() {
  const [scenarioId, setScenarioId] = useState('south-punjab-flood');
  const def = useMemo(() => scenarioById(scenarioId) || SCENARIOS[0], [scenarioId]);

  // Parameters state
  const [params, setParams] = useState(() => ({ ...def.defaults }));
  const [playing, setPlaying] = useState(false);

  // Sync defaults when scenario changes
  useEffect(() => {
    setParams({ ...def.defaults });
    setPlaying(false);
  }, [def]);

  // Timeline playback clock
  const hourRef = useRef(params.hour);
  hourRef.current = params.hour;
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      if (hourRef.current >= def.durationH) {
        setPlaying(false);
        return;
      }
      setParams((prev) => ({ ...prev, hour: Math.min(def.durationH, prev.hour + 2) }));
    }, 400);
    return () => clearInterval(interval);
  }, [playing, def.durationH]);

  // Computed scenario response plans
  const plan = useMemo(() => computePlan(def, params), [def, params]);
  const baselinePlan = useMemo(
    () => computePlan(def, { ...params, strategy: 'uncoordinated' }),
    [def, params]
  );
  const currentState = useMemo(() => stateAt(def, params, params.hour), [def, params]);
  const footprint = useMemo(() => hazardAt(def, params, params.hour), [def, params]);

  const coverageDiff = plan.metrics.coveragePct - baselinePlan.metrics.coveragePct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="What-If Simulation Engine"
        title="Disaster Scenario & Response Simulator"
      >
        Simulate disaster onset, test resource allocations, and benchmark coordinated planning against uncoordinated baselines. Computed strictly via deterministic domain rules.
      </SectionTitle>

      {/* Scenario Selector & Reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Tabs
          label="Scenario Selector"
          value={scenarioId}
          onChange={setScenarioId}
          tabs={SCENARIOS.map((s) => ({ value: s.id, label: s.shortTitle }))}
        />
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setParams({ ...def.defaults });
            setPlaying(false);
          }}
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <RotateCcw size={14} /> Reset Scenario
        </button>
      </div>

      {/* Real-time KPI Bar */}
      <div className="intel-grid intel-grid--4">
        <Metric
          label="Exposed Population"
          value={currentState.exposedPeople.toLocaleString()}
          mode="simulated"
          hint={`At hour T+${params.hour} of ${def.durationH}h timeline`}
          tone="critical"
        />
        <Metric
          label="Rescue Coverage"
          value={`${plan.metrics.coveragePct}%`}
          mode="simulated"
          delta={{ value: coverageDiff, goodWhen: 'up', suffix: '% vs uncoordinated' }}
          hint="Assisted citizens over demand"
          tone={plan.metrics.coveragePct >= 75 ? 'ok' : 'caution'}
        />
        <Metric
          label="Sheltered Demand"
          value={`${plan.metrics.sheltered.toLocaleString()} / ${plan.metrics.shelterCapacity.toLocaleString()}`}
          mode="simulated"
          hint={`Unmet demand: ${plan.metrics.unmet.toLocaleString()}`}
        />
        <Metric
          label="Response Readiness"
          value={plan.readiness.score}
          unit="/100"
          mode="simulated"
          hint={`Grade: ${plan.readiness.grade} (${plan.bottlenecks.length} active bottlenecks)`}
          tone={plan.readiness.score >= 70 ? 'ok' : 'caution'}
        />
      </div>

      {/* Main Grid: Controls (Left), Interactive Map (Center/Right) */}
      <div className="intel-grid intel-grid--split">
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Scenario Parameters" subtitle={def.title} mode="assumption">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                {def.summary}
              </p>

              {/* Dynamic Sliders based on Scenario Definition */}
              {def.controls.map((c) => (
                <Slider
                  key={c.key}
                  label={c.label}
                  value={params[c.key]}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  unit={c.unit}
                  help={c.help}
                  onChange={(val) => setParams((prev) => ({ ...prev, [c.key]: val }))}
                />
              ))}

              {/* Assumed Road Closures */}
              {def.closures.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.4rem' }}>
                    Assumed Road Closures:
                  </label>
                  {def.closures.map((cl) => {
                    const isClosed = params.closures.includes(cl.id);
                    return (
                      <Toggle
                        key={cl.id}
                        label={cl.label}
                        checked={isClosed}
                        onChange={(checked) =>
                          setParams((prev) => ({
                            ...prev,
                            closures: checked
                              ? [...prev.closures, cl.id]
                              : prev.closures.filter((x) => x !== cl.id),
                          }))
                        }
                      />
                    );
                  })}
                </div>
              )}

              {/* Strategy comparison selector */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.4rem' }}>
                  Planning Strategy:
                </label>
                <Tabs
                  label="Planning Strategy"
                  value={params.strategy}
                  onChange={(st) => setParams((prev) => ({ ...prev, strategy: st }))}
                  tabs={[
                    { value: 'coordinated', label: 'Coordinated AI Planner' },
                    { value: 'uncoordinated', label: 'Uncoordinated Local Baseline' },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Active Bottlenecks Alert */}
          {plan.bottlenecks.length > 0 && (
            <Card title="Operational Bottlenecks" mode="simulated">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plan.bottlenecks.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: b.severity === 'critical' ? 'var(--critical-soft)' : 'var(--caution-soft)',
                      border: b.severity === 'critical' ? '1px solid var(--critical-border)' : '1px solid var(--caution-border)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: b.severity === 'critical' ? 'var(--critical)' : 'var(--caution)' }}>
                      <AlertTriangle size={15} />
                      {b.title}
                    </div>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--text)' }}>{b.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Map & Timeline Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Time scrubber bar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setPlaying(!playing)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play Timeline'}
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>Timeline Clock: T+{params.hour} Hours</span>
                <span style={{ color: 'var(--muted)' }}>Peak: T+{def.peakH}h / Total: {def.durationH}h</span>
              </div>
              <input
                type="range"
                min={0}
                max={def.durationH}
                step={1}
                value={params.hour}
                onChange={(e) => setParams((prev) => ({ ...prev, hour: Number(e.target.value) }))}
                className="intel-slider"
              />
            </div>
          </div>

          {/* Interactive Scenario Map */}
          <div style={{ height: 440, position: 'relative' }}>
            <PakMap
              view={{ center: def.view.center, zoom: def.view.zoom }}
              ariaLabel="Scenario Simulation Map"
              closedEdges={currentState.closedEdges}
              screenOverlay={
                <g>
                  {/* Settlements */}
                  {def.settlements.map((s) => {
                    const st = plan.settlements.find((x) => x.settlement.id === s.id);
                    const isExposed = (st?.exposedPeople || 0) > 0;
                    return (
                      <Marker
                        key={s.id}
                        at={s.coord}
                        r={isExposed ? 7 : 4}
                        color={isExposed ? '#ea580c' : 'var(--accent)'}
                        label={`${s.name}: ${s.population.toLocaleString()} pop`}
                        showLabel
                      />
                    );
                  })}
                  {/* Shelters */}
                  {def.shelters.map((sh) => (
                    <Marker
                      key={sh.id}
                      at={sh.coord}
                      r={7}
                      shape="square"
                      color="#16a34a"
                      label={`${sh.name} (Capacity: ${sh.capacity.toLocaleString()})`}
                      showLabel
                    />
                  ))}
                </g>
              }
            />
          </div>

          {/* Coordinated vs Uncoordinated A/B Comparison Table */}
          <Card
            title="A/B Response Strategy Benchmark"
            subtitle="Evaluating Coordinated Planner vs. Fragmented Local Baseline"
            mode="simulated"
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Outcome Metric</th>
                    <th>Coordinated AI Planner</th>
                    <th>Uncoordinated Baseline</th>
                    <th>Performance Gain</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Citizens Assisted & Served</strong></td>
                    <td style={{ fontWeight: 700, color: 'var(--ok)' }}>
                      {plan.metrics.served.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {baselinePlan.metrics.served.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--ok)' }}>
                      +{(plan.metrics.served - baselinePlan.metrics.served).toLocaleString()} ({coverageDiff > 0 ? `+${coverageDiff}%` : 'Parity'})
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Unmet Evacuation Demand</strong></td>
                    <td style={{ fontWeight: 700, color: plan.metrics.unmet > 0 ? 'var(--critical)' : 'var(--ok)' }}>
                      {plan.metrics.unmet.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--critical)' }}>
                      {baselinePlan.metrics.unmet.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--ok)' }}>
                      -{(baselinePlan.metrics.unmet - plan.metrics.unmet).toLocaleString()} reduction
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Shelter Utilization Efficiency</strong></td>
                    <td>{plan.metrics.sheltered.toLocaleString()} / {plan.metrics.shelterCapacity.toLocaleString()}</td>
                    <td>{baselinePlan.metrics.sheltered.toLocaleString()} / {baselinePlan.metrics.shelterCapacity.toLocaleString()}</td>
                    <td>Balanced cross-district assignment</td>
                  </tr>
                  <tr>
                    <td><strong>Readiness Score</strong></td>
                    <td style={{ fontWeight: 700 }}>{plan.readiness.score}/100</td>
                    <td>{baselinePlan.readiness.score}/100</td>
                    <td style={{ fontWeight: 700, color: 'var(--ok)' }}>
                      +{plan.readiness.score - baselinePlan.readiness.score} points
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
