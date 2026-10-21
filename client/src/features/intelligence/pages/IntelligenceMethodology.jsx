import { useState } from 'react';
import { BookOpen, CheckCircle, Database, FileText, Info, ShieldAlert } from 'lucide-react';
import { SOURCES } from '../data/sources';
import { RISK_MODEL_VERSION } from '../risk/engine';
import { ENGINE_VERSION } from '../scenario/engine';
import { Card, ModeBadge, SectionTitle } from '../components/primitives';

export default function IntelligenceMethodology() {
  const [activeSection, setActiveSection] = useState('architecture');

  const sections = [
    { id: 'architecture', title: 'System Architecture' },
    { id: 'risk', title: 'Risk Formula & Provenance' },
    { id: 'scenario', title: 'Simulation Footprints' },
    { id: 'routing', title: 'Graph Routing & Dijkstra' },
    { id: 'allocation', title: 'Greedy Allocation Model' },
    { id: 'sources', title: 'Verified Data Sources' },
    { id: 'limitations', title: 'Known Model Limitations' },
    { id: 'ethics', title: 'Ethical & Safety Disclosures' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="Scientific Rigor & Transparency"
        title="Intelligence Methodology, Math & Data Sources"
      >
        Every computation, risk factor, and scenario output is mathematically formulated and reproducible. Engines run in deterministic TypeScript with zero black-box simulation.
      </SectionTitle>

      {/* Main Grid: Nav (Left) + Content (Right) */}
      <div className="intel-grid intel-grid--split">
        {/* Navigation Table of Contents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card title="Methodology Sections">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeSection === sec.id ? 'var(--accent)' : 'transparent',
                    color: activeSection === sec.id ? '#ffffff' : 'var(--text)',
                    fontWeight: activeSection === sec.id ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.825rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sec.title}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Engine Specifications">
            <dl style={{ margin: 0, fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <dt style={{ color: 'var(--muted)' }}>Risk Model Version:</dt>
                <dd style={{ margin: 0, fontWeight: 700, fontFamily: 'monospace' }}>{RISK_MODEL_VERSION}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--muted)' }}>Simulation Engine:</dt>
                <dd style={{ margin: 0, fontWeight: 700, fontFamily: 'monospace' }}>{ENGINE_VERSION}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--muted)' }}>Execution Environment:</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>Client-side deterministic JS/TS</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--muted)' }}>Offline Support:</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--ok)' }}>100% Bundled Vector Geodata</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Dynamic Content Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeSection === 'architecture' && (
            <Card title="System Architecture & Progressive Integration">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  The AI Disaster App combines the student's original Vite + React + Express frontend/API stack with ported deterministic domain engines from the RAAH disaster intelligence reference implementation.
                </p>
                <ul>
                  <li><strong>Preserved Core:</strong> Original branding, CSS tokens, multilingual i18n (English, Urdu, Hindi), emergency kit checklist, contacts, and Alibaba Qwen chatbot remain primary.</li>
                  <li><strong>Domain Engines:</strong> Multi-hazard risk screening, graph-theoretic road routing, and scenario digital twins execute client-side with zero external latency.</li>
                  <li><strong>Decoupled APIs:</strong> Server-side credentials (such as <code>ALIBABA_API_KEY</code>) remain strictly within the Express boundary. External data feeds (USGS and Open-Meteo) fail gracefully to offline cached baselines.</li>
                </ul>
              </div>
            </Card>
          )}

          {activeSection === 'risk' && (
            <Card title="Risk Index Formulation (INFORM-Style Geometric Mean)">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  Composite disaster risk is calculated using a weighted geometric formulation inspired by the international INFORM Risk Index:
                </p>
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    margin: '0.75rem 0',
                    border: '1px solid var(--border)',
                  }}
                >
                  Risk Score = 100 · (Hazard / 10)^0.5 · (Exposure / 10)^0.3 · (Access / 10)^0.2
                </div>
                <p>
                  <strong>Why Geometric Aggregation?</strong> In an arithmetic sum, an area with zero hazard could artificially show elevated risk solely due to high population. The geometric mean guarantees that if Hazard = 0, the overall Disaster Risk equals zero.
                </p>
                <ul>
                  <li><strong>Hazard (H):</strong> Hydrological proximity to major rivers (exponential decay <code>10·e^(-d/15km)</code>), historical NDMA event frequency, and live 3-day precipitation forecasts.</li>
                  <li><strong>Exposure (E):</strong> Gridded population magnitude classified from tier 1 (under 250k) to tier 5 (over 3M).</li>
                  <li><strong>Access Constraints (A):</strong> Road density within 30 km, nearest highway junction distance, and mountainous terrain penalties.</li>
                </ul>
              </div>
            </Card>
          )}

          {activeSection === 'scenario' && (
            <Card title="Scenario Clock & Synthetic Inundation Corridors">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  The simulator digital twin models disaster progression through a normalized temporal smoothstep function:
                </p>
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    margin: '0.75rem 0',
                    border: '1px solid var(--border)',
                  }}
                >
                  Intensity I(t) = 3(t/peak)^2 - 2(t/peak)^3   (holds at 1.0 after peak)
                  <br />
                  Flood Inundation Width w = 0.5 km + 1.8 km/m · River Rise (m)
                </div>
                <p>
                  <strong>Illustrative Footprints:</strong> Inundation corridors follow the actual Natural Earth Indus, Chenab, and Lai Nullah centrelines. Settlements inside the corridor calculate fractional population exposure and trigger evacuation boat demands.
                </p>
              </div>
            </Card>
          )}

          {activeSection === 'routing' && (
            <Card title="Pakistan Routable Graph (Dijkstra Shortest Path)">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  Pakistan's primary road network is modeled as a weighted graph containing <strong>4,251 vertices and 4,307 edges</strong>:
                </p>
                <ul>
                  <li><strong>Graph Construction:</strong> Extracted from Natural Earth 1:10m vectors, simplified, topologically joined within 2.5 km tolerances, retaining the primary connected component.</li>
                  <li><strong>Speed Modeling:</strong> Major highways (N-5, M-2, M-5) calibrated at 70 km/h; secondary roads at 45 km/h; pedestrian legs at 4.5 km/h.</li>
                  <li><strong>Dynamic Closures:</strong> When river rise inundates road edges, edges are removed from the graph, forcing Dijkstra's algorithm to compute alternative bypass corridors.</li>
                </ul>
              </div>
            </Card>
          )}

          {activeSection === 'allocation' && (
            <Card title="Greedy Resource Allocation & Bottleneck Detection">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  Rescue units are dispatched via a deterministic greedy optimizer:
                </p>
                <ul>
                  <li><strong>Priority Weighting:</strong> Water evacuations (weight 1.5), land evacuations (1.0), and urgent medical triage (2.0). Isolated settlements receive an extra 1.3x urgency multiplier.</li>
                  <li><strong>Unit Throughput:</strong> Rescue boats (6.7 persons/hour), search teams (15 persons/hour), and ambulances (1 emergency patient per cycle).</li>
                  <li><strong>A/B Benchmark:</strong> Coordinated AI allocation is compared against an uncoordinated baseline (where each district responds in isolation without cross-boundary aid).</li>
                </ul>
              </div>
            </Card>
          )}

          {activeSection === 'sources' && (
            <Card title="Registered External Data Sources & Attributions" subtitle="Full provenance, custodians, and licensing records for all bundled data">
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="intel-table" style={{ width: '100%', minWidth: '580px', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30%', whiteSpace: 'nowrap' }}>Source Name</th>
                      <th style={{ width: '28%', whiteSpace: 'nowrap' }}>Provider / Custodian</th>
                      <th style={{ width: '22%', whiteSpace: 'nowrap' }}>Data Mode</th>
                      <th style={{ width: '20%', whiteSpace: 'nowrap' }}>License</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SOURCES.map((s) => (
                      <tr key={s.id}>
                        <td><strong style={{ color: 'var(--text)' }}>{s.name}</strong></td>
                        <td style={{ color: 'var(--text-soft)' }}>{s.provider}</td>
                        <td><ModeBadge mode={s.mode} /></td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.license}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeSection === 'limitations' && (
            <Card title="Explicit Known Limitations & Academic Scope">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <ul>
                  <li><strong>Generalization:</strong> Road networks and river corridors are 1:10m scale; municipal city streets and small drainage nullahs are not mapped.</li>
                  <li><strong>Hydraulic Simplification:</strong> Flood widths use parametric buffers rather than 2D hydrodynamic Saint-Venant equations.</li>
                  <li><strong>No Live Dispatch:</strong> This system is not connected to NDMA or Rescue 1122 live computer-aided dispatch (CAD) mainframes.</li>
                  <li><strong>Synthetic Scenarios:</strong> Incident demands and shelter capacities are pedagogical benchmarks for testing coordination algorithms.</li>
                </ul>
              </div>
            </Card>
          )}

          {activeSection === 'ethics' && (
            <Card title="Ethics, Attribution & Student Ownership">
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  This project was prepared for the Islamabad Final Round presentation under strict standards of academic honesty:
                </p>
                <ul>
                  <li><strong>Primary Authorship:</strong> The AI Disaster App was conceived and built by student <strong>Anam Majid</strong>.</li>
                  <li><strong>Contributed Module Attributions:</strong> Deterministic disaster intelligence modules (risk index, Dijkstra routing, scenario simulator, and judge demo) were ported from the RAAH Disaster Intelligence open-source reference project.</li>
                  <li><strong>Truthful Provenance:</strong> No git history was falsified, no unauthorized commits or stealth trailers were added, and all ported modules are explicitly catalogued in <code>docs/FEATURE_PROVENANCE.md</code>.</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
