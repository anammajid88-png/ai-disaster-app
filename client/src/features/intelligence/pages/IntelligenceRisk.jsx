import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, HelpCircle, ShieldAlert } from 'lucide-react';
import { assessAll, HAZARD_LABELS } from '../risk/engine';
import { REGIONS, regionById } from '../data/regions';
import { PakMap, Marker } from '../components/PakMap';
import { Card, ModeBadge, Provenance, RiskBadge, SectionTitle, Tabs } from '../components/primitives';

const HAZARDS = ['flood', 'urban_flood', 'earthquake', 'heatwave', 'landslide'];

export default function IntelligenceRisk() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHazard = searchParams.get('hazard') || 'flood';
  const [hazard, setHazard] = useState(
    HAZARDS.includes(initialHazard) ? initialHazard : 'flood'
  );
  const [selectedRegionId, setSelectedRegionId] = useState(
    searchParams.get('region') || 'muzaffargarh'
  );

  const list = useMemo(() => assessAll(hazard, {}), [hazard]);
  const selected = useMemo(
    () => list.find((a) => a.regionId === selectedRegionId) || list[0],
    [list, selectedRegionId]
  );
  const r = regionById(selected?.regionId || 'muzaffargarh');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="Deterministic Preparedness Index"
        title="Risk Intelligence & Factor Explainability"
      >
        A transparent, explainable risk index across 12 focus districts in Pakistan. Every score decomposes into Hazard (H), Exposure (E), and Access Constraints (A) with explicit provenance, formulas, and domain assumptions.
      </SectionTitle>

      {/* Hazard Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Tabs
          label="Hazard Selection"
          value={hazard}
          onChange={setHazard}
          tabs={HAZARDS.map((h) => ({ value: h, label: HAZARD_LABELS[h] }))}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          Live Weather Feed: <ModeBadge mode="live" /> (Open-Meteo precipitation models)
        </span>
      </div>

      {/* Main Grid: Interactive Map + Ranked Table on Left, Detailed Inspector on Right */}
      <div className="intel-grid intel-grid--split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Map Preview */}
          <div style={{ height: 360, position: 'relative' }}>
            <PakMap
              view={r ? { center: r.coord, zoom: 6.0 } : { center: [69.6, 30.2], zoom: 5.2 }}
              ariaLabel="Risk distribution map"
              screenOverlay={
                <g>
                  {list.map((a) => {
                    const reg = regionById(a.regionId);
                    if (!reg) return null;
                    const isSelected = a.regionId === selectedRegionId;
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
                        r={isSelected ? 9 : 6 + a.riskScore / 16}
                        color={color}
                        selected={isSelected}
                        pulse={isCrit}
                        label={`${reg.name}: ${a.riskBand} (${a.riskScore})`}
                        showLabel={a.riskScore >= 55 || isSelected}
                        onSelect={() => setSelectedRegionId(a.regionId)}
                      />
                    );
                  })}
                </g>
              }
            />
          </div>

          {/* Regional Ranking Table */}
          <Card
            title={`District Rankings — ${HAZARD_LABELS[hazard]}`}
            subtitle="Sorted descending by composite risk score (0-100)"
            mode="estimated"
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>District / Region</th>
                    <th>Score</th>
                    <th>Formula Factors (H · E · A)</th>
                    <th>Risk Band</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => {
                    const reg = regionById(a.regionId);
                    const isSelected = a.regionId === selectedRegionId;
                    return (
                      <tr
                        key={a.regionId}
                        onClick={() => setSelectedRegionId(a.regionId)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--surface-3)' : undefined,
                        }}
                      >
                        <td>
                          <strong>{reg?.name}</strong>
                          <small style={{ display: 'block', color: 'var(--muted)' }}>
                            {reg?.province}
                          </small>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                          {a.riskScore}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2 }}>
                              <div
                                style={{
                                  width: `${a.riskScore}%`,
                                  height: '100%',
                                  background: a.riskBand === 'critical' ? 'var(--critical)' : a.riskBand === 'high' ? 'var(--warn)' : 'var(--accent)',
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--muted)' }}>
                              H: {a.hazardScore} · E: {a.exposureScore} · A: {a.accessScore}
                            </span>
                          </div>
                        </td>
                        <td>
                          <RiskBadge band={a.riskBand} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: In-Depth Inspector */}
        <div>
          {selected && r && (
            <Card
              title={`${r.name} (${r.province})`}
              subtitle={`Detailed risk assessment for ${HAZARD_LABELS[hazard]}`}
              mode="estimated"
              actions={<RiskBadge band={selected.riskBand} score={selected.riskScore} />}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Mathematical Equation Box */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: 'var(--text)',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>risk</span> = 100 · (H/10)<sup>0.5</sup> · (E/10)<sup>0.3</sup> · (A/10)<sup>0.2</sup>
                  <br />
                  = 100 · ({selected.hazardScore}/10)<sup>0.5</sup> · ({selected.exposureScore}/10)<sup>0.3</sup> · ({selected.accessScore}/10)<sup>0.2</sup> ≈ <strong>{selected.riskScore}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', fontFamily: 'var(--font-sans)' }}>
                    Bands: &lt;30 Low · 30-49 Moderate · 50-69 High · ≥70 Critical
                  </div>
                </div>

                {/* Dimensions breakdown */}
                {(['hazard', 'exposure', 'access']).map((dim) => {
                  const dimTitle =
                    dim === 'hazard'
                      ? `Hazard Severity (H = ${selected.hazardScore})`
                      : dim === 'exposure'
                      ? `Population Exposure (E = ${selected.exposureScore})`
                      : `Access Constraints (A = ${selected.accessScore})`;

                  return (
                    <div key={dim}>
                      <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
                        {dimTitle}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selected.factors
                          .filter((f) => f.dimension === dim)
                          .map((f) => (
                            <div
                              key={f.id}
                              style={{
                                padding: '0.6rem 0.75rem',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.825rem', color: 'var(--text)' }}>{f.label}</strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <ModeBadge mode={f.mode} />
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>
                                    {f.score}/10
                                  </span>
                                </div>
                              </div>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                                {f.value}
                              </p>
                              <small style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                                {f.explanation}
                              </small>
                              <Provenance sourceIds={f.sourceIds} />
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}

                {/* Model Assumptions & Uncertainty */}
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--caution-soft)',
                    border: '1px solid var(--caution-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                  }}
                >
                  <strong style={{ color: 'var(--caution)' }}>Model Assumptions & Uncertainty:</strong>
                  <p style={{ margin: '0.25rem 0 0.5rem', color: 'var(--text)' }}>{selected.uncertainty}</p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-soft)', fontSize: '0.75rem' }}>
                    {selected.assumptions.map((asm, idx) => (
                      <li key={idx}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
