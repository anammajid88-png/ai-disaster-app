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
