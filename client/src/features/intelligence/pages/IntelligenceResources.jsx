import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ambulance,
  Anchor,
  CheckCircle2,
  Clock,
  ListOrdered,
  RotateCcw,
  Ship,
  Truck,
  Users,
} from 'lucide-react';
import { SCENARIOS } from '../scenario/definitions';
import { computePlan, unitStatus } from '../scenario/engine';
import { Card, Metric, ModeBadge, SectionTitle, Tabs } from '../components/primitives';

export default function IntelligenceResources() {
  const [scenarioId, setScenarioId] = useState('south-punjab-flood');
  const def = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const [hour, setHour] = useState(12);
  const [manualOverrides, setManualOverrides] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [unitTypeFilter, setUnitTypeFilter] = useState('all');

  const plan = useMemo(
    () => computePlan(def, def.defaults, manualOverrides),
    [def, manualOverrides]
  );
  const baseline = useMemo(
    () => computePlan(def, { ...def.defaults, strategy: 'uncoordinated' }),
    [def]
  );

  const handleReassign = (unitId, targetNeedId) => {
    const unit = plan.units.find((u) => u.id === unitId);
    const need = plan.needs.find((n) => n.id === targetNeedId);
    const targetSettlement = need ? def.settlements.find((s) => s.id === need.settlementId) : null;

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      text: targetNeedId
        ? `Dispatcher reassigned ${unit?.name || unitId} to ${targetSettlement?.name} (${need?.label || 'rescue'}).`
        : `Dispatcher stood down ${unit?.name || unitId} to standby.`,
    };

    setManualOverrides((prev) => ({ ...prev, [unitId]: targetNeedId }));
    setAuditLog((prev) => [logEntry, ...prev.slice(0, 20)]);
  };

  const handleReset = () => {
    setManualOverrides({});
    setAuditLog((prev) => [
      { timestamp: new Date().toLocaleTimeString(), text: 'Dispatch reset to AI optimal planner.' },
      ...prev,
    ]);
  };

  const filteredUnits = useMemo(() => {
    if (unitTypeFilter === 'all') return plan.units;
    return plan.units.filter((u) => u.type === unitTypeFilter);
  }, [plan.units, unitTypeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="Rescue Fleet Command"
        title="Simulated Resource Dispatch & Relief Coordination"
      >
        Track simulated Rescue 1122 and civil defence assets (boats, ambulances, 4x4 search teams), evaluate demand coverage, and execute dispatcher overrides with live recalculation.
      </SectionTitle>

      {/* Scenario and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Tabs
          label="Scenario Selector"
          value={scenarioId}
          onChange={(id) => {
            setScenarioId(id);
            setManualOverrides({});
          }}
          tabs={SCENARIOS.map((s) => ({ value: s.id, label: s.shortTitle }))}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {Object.keys(manualOverrides).length} manual override(s)
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleReset}
            disabled={!Object.keys(manualOverrides).length}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <RotateCcw size={14} /> Reset Dispatch
          </button>
        </div>
      </div>

      {/* Comparative Triad: AI Planner vs Baseline vs Active Dispatch */}
      <div className="intel-grid intel-grid--3">
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Uncoordinated Baseline
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)', margin: '0.25rem 0' }}>
            {baseline.metrics.coveragePct}%
          </div>
          <small style={{ color: 'var(--muted)' }}>
            {baseline.metrics.served.toLocaleString()} served · {baseline.metrics.unmet.toLocaleString()} unmet
          </small>
        </div>

        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-3) 100%)',
            border: '2px solid var(--accent)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Active Dispatch (Your Control)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', margin: '0.25rem 0' }}>
            {plan.metrics.coveragePct}%
          </div>
          <small style={{ color: 'var(--text-soft)' }}>
            {plan.metrics.served.toLocaleString()} served · {plan.metrics.unmet.toLocaleString()} unmet
          </small>
        </div>

        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Fleet Deployment Ratio
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)', margin: '0.25rem 0' }}>
            {plan.metrics.unitsDeployed} / {plan.metrics.unitsTotal}
          </div>
          <small style={{ color: 'var(--muted)' }}>
            Boats, ambulances and rescue units active
          </small>
        </div>
      </div>

      {/* Main Grid: Incident Demand by Settlement (Left) + Units Fleet Table (Right) */}
      <div className="intel-grid intel-grid--split">
        {/* Settlement Demand Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            title="Incident Demand by Settlement"
            subtitle="Calculated need based on simulated flood water surge"
            mode="simulated"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {def.settlements.map((s) => {
                const sNeeds = plan.needs.filter((n) => n.settlementId === s.id);
                if (!sNeeds.length) return null;

                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem' }}>{s.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Pop: {s.population.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {sNeeds.map((n) => {
                        const assignedUnits = plan.assignments.filter((a) => a.needId === n.id);
                        const servedCount = assignedUnits.reduce((acc, a) => acc + a.contribution, 0);
                        const isSatisfied = servedCount >= n.demand;

                        return (
                          <div
                            key={n.id}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.4rem 0.5rem',
                              background: 'var(--surface)',
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              <strong>{n.label}</strong> (Required: {n.demand})
                            </span>
                            <span style={{ fontWeight: 600, color: isSatisfied ? 'var(--ok)' : 'var(--critical)' }}>
                              {servedCount} / {n.demand} {isSatisfied ? '✓' : '⚠'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Dispatcher Audit Trail */}
          <Card title="Dispatcher Audit Trail" subtitle="Local operational action log" mode="simulated">
            {auditLog.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {auditLog.map((log, idx) => (
                  <li key={idx}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>[{log.timestamp}]</span> {log.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                No manual dispatcher interventions yet. Currently running AI optimal allocation.
              </p>
            )}
          </Card>
        </div>

        {/* Fleet Units Dispatcher Table */}
        <div>
          <Card
            title="Rescue Fleet Management"
            subtitle="Inspect individual units and reassign to priority demands"
            mode="simulated"
            actions={
              <select
                value={unitTypeFilter}
                onChange={(e) => setUnitTypeFilter(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 4, border: '1px solid var(--border)' }}
              >
                <option value="all">All Vehicle Types</option>
                <option value="boat">Rescue Boats</option>
                <option value="team">Ground 4x4 Teams</option>
                <option value="ambulance">Medical Ambulances</option>
              </select>
            }
          >
            <div style={{ overflowX: 'auto', maxHeight: 580, overflowY: 'auto' }}>
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Unit ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Assignment / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((u) => {
                    const assignment = plan.assignments.find((a) => a.unitId === u.id);
                    const currentNeed = plan.needs.find((n) => n.id === assignment?.needId);
                    const currentSettlement = currentNeed
                      ? def.settlements.find((s) => s.id === currentNeed.settlementId)
                      : null;

                    const status = unitStatus(plan, u.id, hour);

                    return (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.7rem' }}>
                            Base: {u.base}
                          </small>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{u.type}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color:
                                status === 'on-scene'
                                  ? 'var(--ok)'
                                  : status === 'en-route'
                                  ? 'var(--warn)'
                                  : status === 'assigned'
                                  ? 'var(--accent)'
                                  : 'var(--muted)',
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={assignment?.needId || ''}
                            onChange={(e) => handleReassign(u.id, e.target.value || null)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.4rem',
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              maxWidth: 180,
                            }}
                          >
                            <option value="">Standby (Unassigned)</option>
                            {plan.needs.map((n) => {
                              const s = def.settlements.find((x) => x.id === n.settlementId);
                              return (
                                <option key={n.id} value={n.id}>
                                  {s?.name}: {n.label}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
