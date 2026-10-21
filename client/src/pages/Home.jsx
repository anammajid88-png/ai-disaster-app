import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import DisasterCard from '../components/DisasterCard';
import GuidelinesModal from '../components/GuidelinesModal';
import SafetyIcon from '../components/SafetyIcon';
import UiIcon from '../components/UiIcon';
import { contacts, disasters, disastersById } from '../data';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLanguage } from '../i18n/LanguageProvider';
import './Home.css';

const HOW_ICONS = ['checklist', 'eye-watch', 'helping-hand'];

export default function Home() {
  const { t, localize, languages } = useLanguage();
  const [openId, setOpenId] = useState(null);

  // Home keeps the plain app name as the tab title.
  useDocumentMeta({ description: t('home.hero.subtitle'), path: '/' });

  const closeGuidelines = useCallback(() => setOpenId(null), []);

  const stats = [
    { value: disasters.length, labelKey: 'home.stats.disasters' },
    { value: languages.length, labelKey: 'home.stats.languages' },
    { value: contacts.length, labelKey: 'home.stats.contacts' },
    { value: '✓', labelKey: 'home.stats.offline' },
  ];

  return (
    <>
      {/* ---- Hero ---------------------------------------------------- */}
      <section className="hero">
        <div className="container hero__inner">
          <span className="hero__badge">
            <UiIcon name="shield" size={16} />
            {t('home.hero.badge')}
          </span>

          <h1 className="hero__title">{t('home.hero.title')}</h1>
          <p className="hero__tagline">{t('app.tagline')}</p>
          <p className="hero__subtitle">{t('home.hero.subtitle')}</p>

          <div className="hero__actions">
            <Link to="/ai" className="btn hero__cta">
              <UiIcon name="spark" size={20} />
              {t('home.hero.ctaAi')}
            </Link>
            <Link to="/emergency" className="btn btn--secondary hero__cta">
              <SafetyIcon name="phone-call" size={20} />
              {t('home.hero.ctaEmergency')}
            </Link>
          </div>

          <p className="hero__note">{t('home.hero.note')}</p>

          <dl className="hero__stats">
            {stats.map((stat) => (
              <div key={stat.labelKey} className="hero__stat">
                <dt className="num">{stat.value}</dt>
                <dd>{t(stat.labelKey)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- Disaster categories ------------------------------------ */}
      <section className="section" id="disasters">
        <div className="container">
          <div className="section__head">
            <h2>{t('home.disasters.title')}</h2>
            <p>{t('home.disasters.subtitle')}</p>
          </div>

          <div className="grid grid--cards">
            {disasters.map((disaster) => (
              <DisasterCard key={disaster.id} disaster={disaster} onOpenGuidelines={setOpenId} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Disaster Intelligence Preview ------------------------- */}
      <section className="section" id="intelligence-preview">
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, var(--blue-50) 0%, var(--surface) 100%)',
              border: '1px solid var(--blue-200)',
              borderRadius: 'var(--radius-xl)',
              padding: 'clamp(1.5rem, 3vw, 2.5rem)',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 'var(--fw-bold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <UiIcon name="shield" size={16} />
                {t('home.intelligence.eyebrow')}
              </span>
              <h2 style={{ fontSize: 'var(--fs-h2)', margin: '0 0 var(--space-2)', color: 'var(--text)' }}>
                {t('home.intelligence.title')}
              </h2>
              <p style={{ color: 'var(--text-soft)', fontSize: 'var(--fs-base)', lineHeight: 'var(--lh-body)', margin: '0 0 var(--space-5)' }}>
                {t('home.intelligence.subtitle')}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Link to="/intelligence" className="btn btn--primary">
                  <UiIcon name="spark" size={18} />
                  {t('home.intelligence.cta')}
                </Link>
                <Link to="/intelligence/demo" className="btn btn--secondary">
                  9-Step Judge Showcase →
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ padding: 'var(--space-4)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Multi-Hazard Index</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', marginTop: '0.25rem' }}>12 Districts</div>
                <small style={{ color: 'var(--text-soft)' }}>Risk = H^0.5 · E^0.3 · A^0.2</small>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Road Network Graph</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', marginTop: '0.25rem' }}>4,251 Nodes</div>
                <small style={{ color: 'var(--text-soft)' }}>Dijkstra Evacuation Routing</small>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>What-If Simulation</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--ok)', marginTop: '0.25rem' }}>+18% Coverage</div>
                <small style={{ color: 'var(--text-soft)' }}>Coordinated vs Uncoordinated</small>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Offline Geodata</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)', marginTop: '0.25rem' }}>100% Bundled</div>
                <small style={{ color: 'var(--text-soft)' }}>Natural Earth Public Domain</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How it helps ------------------------------------------- */}
      <section className="section how">
        <div className="container">
          <div className="section__head">
            <h2>{t('home.how.title')}</h2>
          </div>

          <ol className="how__list">
            {t('home.how.steps').map((step, index) => (
              <li key={step.title} className="how__item">
                <span className="how__icon">
                  <SafetyIcon name={HOW_ICONS[index]} size={24} />
                </span>
                <span className="how__num num">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Quick call band ---------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="quick-call">
            <div className="quick-call__text">
              <h2>{t('home.quickCall.title')}</h2>
              <p>{t('home.quickCall.text')}</p>
            </div>
            <div className="quick-call__numbers">
              {contacts.slice(0, 3).map((contact) => (
                <a
                  key={contact.id}
                  href={`tel:${contact.number}`}
                  className="quick-call__btn"
                  aria-label={t('emergency.contacts.callAria', {
                    name: localize(contact.name),
                    number: contact.number,
                  })}
                >
                  <SafetyIcon name={contact.icon} size={22} />
                  <strong className="tel">{contact.number}</strong>
                </a>
              ))}
            </div>
            <Link to="/emergency" className="quick-call__link">
              {t('home.quickCall.cta')}
              <UiIcon name="arrow-right" size={18} className="icon-flip" />
            </Link>
          </div>
        </div>
      </section>

      {openId ? (
        <GuidelinesModal disaster={disastersById[openId]} onClose={closeGuidelines} />
      ) : null}
    </>
  );
}
