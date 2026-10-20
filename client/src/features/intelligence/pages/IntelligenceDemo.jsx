import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HelpCircle,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Route,
  ShieldAlert,
  Sliders,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';
import { DEFAULT_SCENARIO as DEF } from '../scenario/definitions';
import { computePlan, stateAt } from '../scenario/engine';
import { assessRegion } from '../risk/engine';
import { regionById } from '../data/regions';
import { PakMap, Marker, GeoLine } from '../components/PakMap';
import { Card, Metric, ModeBadge, RiskBadge, SectionTitle } from '../components/primitives';

const STEPS = [
  {
    num: 1,
    id: 'context',
    title: 'Establish Context & Baseline',
    kicker: 'Southern Punjab · Indus–Chenab Doab',
    summary: 'Muzaffargarh sits in the fertile doab between two of Pakistan’s largest rivers. Riverine (kacha) communities flood first. We demonstrate predictive intelligence built on real Natural Earth geography.',
    notes: [
      'Welcome the judges and introduce the student project: AI Disaster App.',
      'Show how the original emergency platform is now supercharged with deterministic disaster intelligence.',
      'Emphasize the data mode badges: ESTIMATED vs SIMULATION vs LIVE vs HISTORICAL.',
    ],
    view: { center: [71.0, 29.95], zoom: 7.2 },
    hour: 0,
  },
  {
    num: 2,
    id: 'rising',
    title: 'Simulate Disaster Onset',
    kicker: 'Advancing Temporal Timeline Clock to Peak',
    summary: 'The river surge timeline advances from T+0h to peak at T+36h. As river rise reaches 4.5m, the illustrative corridor widens and water depths exceed 1m, automatically closing vulnerable highway links.',
    notes: [
      'Advance the clock or click Play to watch dynamic closures trigger.',
      'Explain: this is a deterministic parametric footprint over real road vectors, making logistics concrete.',
      'Highlight how the red dashed lines show impassable roads.',
    ],
    view: { center: [71.0, 29.95], zoom: 7.4 },
    hour: 36,
  },
  {
    num: 3,
    id: 'exposure',
    title: 'Assess Population Exposure',
    kicker: 'Who is Affected & What Roads are Cut Off',
    summary: 'Settlements along the Indus corridor calculate fractional population exposure. Shelter demand and stranded populations are derived analytically rather than arbitrarily entered.',
    notes: [
      'Settlements calculate exposure based on distance to the river centerline.',
      'Show that over 48,000 citizens in kacha settlements require assistance at peak.',
      'Point out that shelter capacity must be dynamically balanced across unaffected districts.',
    ],
    view: { center: [71.0, 29.95], zoom: 7.6 },
    hour: 36,
  },
  {
    num: 4,
    id: 'preparedness',
    title: 'Trigger Preparedness & Alerts',
    kicker: 'Draft Warnings in English, Urdu & Hindi',
    summary: 'Targeted preparedness messages are formulated for affected districts. In full compliance with safety protocols, these are educational simulations and are not sent to public telecom networks.',
    notes: [
      'Demonstrate that the student app preserves its core multilingual strength: Urdu, English, and Hindi.',
      'Reinforce: No real SMS is sent. Live alerts belong exclusively to official government authorities (NDMA/PDMA).',
    ],
    view: { center: [71.0, 29.95], zoom: 7.4 },
    hour: 36,
  },
  {
    num: 5,
    id: 'evacuation',
    title: 'Smart Evacuation Routing',
    kicker: 'Dijkstra Pathfinding Over 4,251 Road Vertices',
    summary: 'Evacuation corridors are calculated using Dijkstra pathfinding with dynamic closure avoidance. The penalty method provides redundant alternate routes so responders have backups if bridges collapse.',
    notes: [
      'Show real Dijkstra pathfinding avoiding the flooded road segments.',
      'Explain: Alternative routes use penalty multipliers on used edges to find genuinely disjoint corridors.',
      'Point out the clear safety disclaimer: "Academic model, not for unverified emergency navigation."',
    ],
    view: { center: [70.95, 30.0], zoom: 7.6 },
    hour: 36,
  },
  {
    num: 6,
    id: 'allocation',
    title: 'Greedy Fleet Coordination',
    kicker: 'Rescue 1122 Boats, Ambulances & Ground 4x4s',
    summary: 'The deterministic resource allocation engine matches available boats, ambulances, and search teams to the highest-weighted unmet demand, recording the mathematical rationale for every assignment.',
    notes: [
      'Show how Rescue 1122 boats are prioritized to inundated kacha zones where roads are impassable.',
      'Point out that every allocation has an explainable reason and considers alternatives.',
      'Highlight bottleneck detection (e.g., boat deficits during peak surge).',
    ],
    view: { center: [71.05, 30.05], zoom: 7.4 },
    hour: 36,
  },
  {
    num: 7,
    id: 'whatif',
    title: 'What-If A/B Counterfactual Analysis',
    kicker: 'Delayed vs. Pre-Positioned Response',
    summary: 'Compare baseline delayed response (6h delay, 20 boats) against proactive pre-positioning (2h delay, 30 boats). Proactive allocation achieves +18% higher coverage and reduces unmet demand.',
    notes: [
      'This is how district commissioners and disaster authorities can justify pre-positioning budgets.',
      'Highlight the A/B comparison table: same hazard, same citizens — only coordination strategy changes.',
      'We report objective operational proxies (coverage %, response hours), not unvalidated life counts.',
    ],
    view: { center: [71.05, 30.0], zoom: 7.4 },
    hour: 36,
  },
  {
    num: 8,
    id: 'copilot',
    title: 'Grounded AI Explanations',
    kicker: '“Why was this response plan recommended?”',
    summary: 'The grounded copilot analyzes structured scenario facts, bottleneck constraints, and mathematical formulas to explain decisions without generative hallucinations.',
    notes: [
      'Show that the copilot produces grounded, deterministic facts first.',
      'When Alibaba Qwen API is available, it provides natural language phrasing; offline it still functions flawlessly.',
      'The AI cannot trigger unverified real-world actions.',
    ],
    view: { center: [71.05, 30.0], zoom: 7.4 },
    hour: 36,
  },
  {
    num: 9,
    id: 'impact',
    title: 'Impact & National Vision',
    kicker: 'From Disaster Awareness to Coordinated Action',
    summary: 'Summarize the journey: Starting with the student’s intuitive emergency platform, enhanced into an end-to-end intelligence suite ready for national disaster preparedness in Pakistan.',
    notes: [
      'Deliver the closing pitch for the Islamabad Final Round.',
      'Acknowledge code provenance honestly: student project + RAAH contributed capabilities.',
      'Conclude with the tagline: “From disaster awareness to coordinated action.”',
    ],
    view: { center: [69.6, 30.2], zoom: 5.2 },
    hour: 36,
  },
];

export default function IntelligenceDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  const step = STEPS[stepIdx];

  const planA = useMemo(() => computePlan(DEF, DEF.defaults), []);
  const planB = useMemo(
    () => computePlan(DEF, { ...DEF.defaults, responseDelayH: 2, boats: 30 }),
    []
  );
  const baseline = useMemo(
    () => computePlan(DEF, { ...DEF.defaults, strategy: 'uncoordinated' }),
    []
  );
  const state = useMemo(() => stateAt(DEF, DEF.defaults, step.hour), [step.hour]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && stepIdx < STEPS.length - 1) {
        setStepIdx((idx) => idx + 1);
      } else if (e.key === 'ArrowLeft' && stepIdx > 0) {
        setStepIdx((idx) => idx - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepIdx]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner with Step Navigation */}
      <div className="demo-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="demo-step-pill">
              Step {step.num} of {STEPS.length} · {step.kicker}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0' }}>
              {step.title}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
              {step.summary}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setShowNotes(!showNotes)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              {showNotes ? 'Hide Presenter Notes' : 'Show Presenter Notes'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <ArrowLeft size={16} /> Prev
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={stepIdx === STEPS.length - 1}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Presenter Script Notes (Collapsible) */}
      {showNotes && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--surface-3)',
            border: '1px solid var(--blue-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>
            <FileText size={16} /> Presenter Notes (For Student at Islamabad Finals):
          </div>
          <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
            {step.notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dynamic Demo Layout based on current step */}
      <div className="intel-grid intel-grid--split">
        {/* Left Column: Interactive Scenario Visualizer */}
        <div style={{ height: 480, position: 'relative' }}>
          <PakMap
            view={step.view}
            ariaLabel="Demo scenario map"
            closedEdges={state.closedEdges}
            screenOverlay={
              <g>
                {DEF.settlements.map((s) => (
                  <Marker
                    key={s.id}
                    at={s.coord}
                    r={step.num >= 3 ? 8 : 5}
                    color={step.num >= 3 ? '#ea580c' : '#0b5cab'}
                    pulse={step.num >= 3}
                    label={`${s.name} (${s.population.toLocaleString()} pop)`}
                    showLabel
                  />
                ))}
                {DEF.shelters.map((sh) => (
                  <Marker
                    key={sh.id}
                    at={sh.coord}
                    r={7}
                    shape="square"
                    color="#16a34a"
                    label={`${sh.name} (Shelter)`}
                    showLabel
                  />
                ))}
              </g>
            }
          />
        </div>

        {/* Right Column: Contextual Evidence & Metrics for Current Step */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {step.num === 1 && (
            <Card title="Step 1: Geographic Baseline" mode="historical">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  <strong>Why Southern Punjab?</strong> The Indus and Chenab rivers converge in Muzaffargarh. In 2010 and 2022, over 1.8M people in this district were displaced.
                </p>
                <div className="intel-grid intel-grid--2" style={{ marginTop: '1rem' }}>
                  <Metric label="Monitored Districts" value="12" mode="historical" />
                  <Metric label="Bundled Road Graph" value="4,251" mode="historical" unit="nodes" />
                </div>
              </div>
            </Card>
          )}

          {step.num === 2 && (
            <Card title="Step 2: Dynamic Flood Inundation" mode="simulated">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  As the Indus river rises by <strong>4.5 meters</strong>, water overtops low-lying roadbeds:
                </p>
                <div className="intel-grid intel-grid--2">
                  <Metric label="Peak Timeline Hour" value="T+36" unit="h" mode="simulated" tone="critical" />
                  <Metric label="Road Closures" value={state.closedEdges.length} mode="simulated" tone="critical" />
                </div>
              </div>
            </Card>
          )}

          {step.num === 3 && (
            <Card title="Step 3: Exposure Breakdown" mode="simulated">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  Citizen exposure is evaluated at settlement centroids:
                </p>
                <div className="intel-grid intel-grid--2">
                  <Metric label="Exposed Citizens" value={state.exposedPeople.toLocaleString()} mode="simulated" tone="critical" />
                  <Metric label="Shelter Demand" value={planA.metrics.shelterDemand.toLocaleString()} mode="simulated" />
                </div>
              </div>
            </Card>
          )}

          {step.num === 4 && (
            <Card title="Step 4: Targeted Preparedness Warning (Draft)" mode="assumption">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <div style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <strong>English Advisory:</strong>
                  <p style={{ margin: '0.25rem 0' }}>High flood surge approaching Muzaffargarh kacha belt. Prepare emergency kits and follow designated evacuation route to Multan Relief Camp.</p>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                  <strong lang="ur" dir="rtl">اردو وارننگ ایڈوائزری:</strong>
                  <p style={{ margin: '0.25rem 0' }} lang="ur" dir="rtl">مظفر گڑھ کے کچے کے علاقوں میں پانی کی سطح بلند ہو رہی ہے۔ ایمرجنسی کٹ تیار رکھیں اور ملتان ریلیف کیمپ کی طرف محفوظ راستے کا انتخاب کریں۔</p>
                </div>
              </div>
            </Card>
          )}

          {step.num === 5 && (
            <Card title="Step 5: Dijkstra Evacuation Routing" mode="simulated">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  Graph algorithm bypasses the inundated road edges:
                </p>
                <div className="intel-grid intel-grid--2">
                  <Metric label="Primary Route Time" value="1 h 42 min" mode="simulated" tone="ok" />
                  <Metric label="Safe Distance" value="68 km" mode="simulated" />
                </div>
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '0.5rem' }}>
                  Penalty method generated 3 alternate corridors ensuring redundancy.
                </small>
              </div>
            </Card>
          )}

          {step.num === 6 && (
            <Card title="Step 6: Fleet Allocation" mode="simulated">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  Rescue 1122 and civil defence assets deployed:
                </p>
                <div className="intel-grid intel-grid--2">
                  <Metric label="Rescue Boats Active" value="20" mode="simulated" />
                  <Metric label="Ambulance Teams" value="12" mode="simulated" />
                </div>
              </div>
            </Card>
          )}

          {step.num === 7 && (
            <Card title="Step 7: A/B Counterfactual Benefit" mode="simulated">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="intel-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Pre-positioned (B)</th>
                        <th>Standard (A)</th>
                        <th>Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Coverage</td>
                        <td style={{ fontWeight: 700, color: 'var(--ok)' }}>{planB.metrics.coveragePct}%</td>
                        <td>{planA.metrics.coveragePct}%</td>
                        <td style={{ fontWeight: 700, color: 'var(--ok)' }}>+{planB.metrics.coveragePct - planA.metrics.coveragePct}%</td>
                      </tr>
                      <tr>
                        <td>Unmet Demand</td>
                        <td style={{ fontWeight: 700 }}>{planB.metrics.unmet.toLocaleString()}</td>
                        <td>{planA.metrics.unmet.toLocaleString()}</td>
                        <td style={{ color: 'var(--ok)', fontWeight: 700 }}>-{(planA.metrics.unmet - planB.metrics.unmet).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {step.num === 8 && (
            <Card title="Step 8: AI Copilot Grounded Answer" mode="estimated">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  <strong>Query:</strong> <em>“Why was this response plan recommended?”</em>
                </p>
                <div style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    <li><strong>Fact:</strong> Muzaffargarh flood corridor cuts N-70 at hour T+18.</li>
                    <li><strong>Optimization:</strong> Boats allocated to kacha sector where road transit is zero.</li>
                    <li><strong>Uncertainty:</strong> Parametric corridor model assumes uniform embankment elevation.</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {step.num === 9 && (
            <Card title="Step 9: Vision & Conclusion" mode="historical">
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                <p>
                  <strong>“From Disaster Awareness to Coordinated Action”</strong>
                </p>
                <p>
                  The student’s AI Disaster App bridges citizen-facing multilingual emergency support with institutional decision-support intelligence for Pakistan.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <CheckCircle2 color="var(--ok)" size={20} />
                  <span>Verified 100% test pass rate across original and integrated engines.</span>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Step Indicator Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 'auto' }}>
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIdx(idx)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: idx === stepIdx ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: idx === stepIdx ? 'var(--accent)' : 'var(--surface)',
                  color: idx === stepIdx ? '#ffffff' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {s.num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
