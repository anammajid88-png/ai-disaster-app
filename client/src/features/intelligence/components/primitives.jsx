import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, Loader2, RefreshCw } from 'lucide-react';
import { sourceById } from '../data/sources';

export const cx = (...c) => c.filter(Boolean).join(' ');

// Button Component
export function Button({ variant = 'secondary', size = 'md', className = '', loading = false, children, ...rest }) {
  const baseCls = 'btn';
  const variantCls = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    danger: 'btn--danger',
    ghost: 'btn--ghost'
  }[variant] || '';

  return (
    <button
      className={cx(baseCls, variantCls, className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" size={16} aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = 'secondary', className = '', children, external = false, ...rest }) {
  const baseCls = 'btn';
  const variantCls = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    ghost: 'btn--ghost'
  }[variant] || '';

  if (external) {
    return (
      <a href={href} className={cx(baseCls, variantCls, className)} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={cx(baseCls, variantCls, className)} {...rest}>
      {children}
    </Link>
  );
}

// Card Panel Component
export function Card({ title, subtitle, actions, mode, children, className = '', bodyClassName = '', id }) {
  return (
    <section id={id} className={cx('panel', className)} aria-label={typeof title === 'string' ? title : undefined}>
      {(title || actions) && (
        <header>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {title && <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{title}</h2>}
              {mode && <ModeBadge mode={mode} />}
            </div>
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{actions}</div>}
        </header>
      )}
      <div className={cx('panel-body', bodyClassName)}>{children}</div>
    </section>
  );
}

// Mode Badges with Provenance semantics
const MODE_STYLE = {
  live: { label: 'LIVE DATA', cls: 'badge-mode--live', hint: 'Retrieved from an external source during this session.' },
  cached: { label: 'CACHED LIVE', cls: 'badge-mode--live', hint: 'Last successful live retrieval stored on this device.' },
  historical: { label: 'HISTORICAL', cls: 'badge-mode--historical', hint: 'Observed events or published official datasets.' },
  estimated: { label: 'ESTIMATED', cls: 'badge-mode--historical', hint: 'Analytically derived from validated inputs.' },
  simulated: { label: 'SIMULATION', cls: 'badge-mode--simulated', hint: 'Synthetic scenario output — not observed data.' },
  assumption: { label: 'ASSUMPTION', cls: 'badge-mode--assumption', hint: 'Documented disaster planning assumption.' },
  unavailable: { label: 'UNAVAILABLE', cls: 'badge-mode--unavailable', hint: 'Source unreachable; no simulated data substituted.' },
};

export function ModeBadge({ mode, className = '' }) {
  const s = MODE_STYLE[mode] || MODE_STYLE.simulated;
  return (
    <span title={s.hint} className={cx('badge-mode', s.cls, className)}>
      {s.label}
    </span>
  );
}

// Risk Band Badges
export function RiskBadge({ band, score }) {
  const b = band?.toLowerCase() || 'low';
  return (
    <span className={cx('badge-risk', `badge-risk--${b}`)}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} aria-hidden />
      <span style={{ textTransform: 'capitalize' }}>{band}</span>
      {score !== undefined && <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{score}</span>}
    </span>
  );
}

// Metric Component
export function Metric({ label, value, unit, mode, hint, tone = 'default', delta, className = '' }) {
  return (
    <div className={cx('intel-metric', className)}>
      <div className="intel-metric__label">
        <span>{label}</span>
        {mode && <ModeBadge mode={mode} />}
      </div>
      <div className="intel-metric__value">
        <span>{value}</span>
        {unit && <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)', marginLeft: '0.25rem' }}>{unit}</span>}
        {delta && delta.value !== 0 && (
          <span style={{ fontSize: '0.8rem', marginLeft: 'auto', color: (delta.value > 0) === (delta.goodWhen === 'up') ? 'var(--ok)' : 'var(--critical)' }}>
            {delta.value > 0 ? '+' : ''}{delta.value.toLocaleString('en')}{delta.suffix || ''}
          </span>
        )}
      </div>
      {hint && <div className="intel-metric__hint">{hint}</div>}
    </div>
  );
}

// Slider Control
export function Slider({ label, value, min, max, step, unit = '', help, onChange, format }) {
  const id = useId();
  return (
    <div className="intel-slider-group">
      <div className="intel-slider-header">
        <label htmlFor={id} style={{ fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
        <output htmlFor={id} style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--surface-3)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
          {format ? format(value) : value}{unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="intel-slider"
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {help && <p id={`${id}-help`} style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>{help}</p>}
    </div>
  );
}

// Toggle Switch
export function Toggle({ label, checked, onChange, description }) {
  const id = useId();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', margin: '0.5rem 0' }}>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: 38,
          height: 22,
          borderRadius: 999,
          border: '1px solid var(--border-strong)',
          background: checked ? 'var(--accent)' : 'var(--surface-3)',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 0.15s ease'
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.15s ease'
          }}
        />
        <span className="sr-only">{label}</span>
      </button>
      <label htmlFor={id} style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        {description && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>{description}</span>}
      </label>
    </div>
  );
}

// Tabs
export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 8, border: '1px solid var(--border)' }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: 6,
            fontSize: '0.8rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            background: value === t.value ? 'var(--surface)' : 'transparent',
            color: value === t.value ? 'var(--accent)' : 'var(--text-2)',
            boxShadow: value === t.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Provenance Expander
export function Provenance({ sourceIds, className = '' }) {
  const [open, setOpen] = useState(false);
  const sources = (sourceIds || []).map((id) => sourceById(id)).filter(Boolean);
  if (!sources.length) return null;

  return (
    <div className={cx('intel-provenance', className)} style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline dotted', cursor: 'pointer', color: 'var(--accent)', fontWeight: 500 }}
      >
        Verified Data Sources ({sources.length})
      </button>
      {open && (
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', listStyle: 'disc' }}>
          {sources.map((s) => (
            <li key={s.id} style={{ margin: '0.25rem 0' }}>
              <strong>{s.name}</strong> ({s.mode}) — {s.citation} [{s.license}]
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Safety Demo Notice
export function DemoNotice({ compact = false }) {
  return (
    <div className={cx('intel-notice', 'intel-notice--caution', compact ? 'compact' : '')} role="note">
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
      <div>
        <strong>Academic Demonstration & Simulation:</strong> Outputs on this dashboard are analytical models and simulations. This system is an academic competition showcase and is not connected to live dispatch for NDMA or Rescue 1122. In an actual emergency in Pakistan, dial <strong>1122</strong> (Rescue) or <strong>15</strong> (Police).
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {eyebrow && <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', margin: 0 }}>{eyebrow}</p>}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0.25rem 0 0' }}>{title}</h1>
      {children && <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{children}</div>}
    </div>
  );
}
