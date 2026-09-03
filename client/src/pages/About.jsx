import { Link } from 'react-router-dom';
import SafetyIcon from '../components/SafetyIcon';
import UiIcon from '../components/UiIcon';
import { contactsMeta, disasters } from '../data';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLanguage } from '../i18n/LanguageProvider';
import './About.css';

/* Icons pair with the meaning of each list, they never carry meaning alone. */
const WHO_ICONS = ['shelter-home', 'helping-hand', 'phone-call', 'kit-bag'];

export default function About() {
  const { t, languages } = useLanguage();

  useDocumentMeta({
    title: t('about.title'),
    description: t('about.subtitle'),
    path: '/about',
  });

  const whoItems = t('about.who.items');
  const howItems = t('about.how.items');
  const limitItems = t('about.limits.items');
  const stackItems = t('about.stack.items');

  return (
    <div className="container about">
      <header className="page-head">
        <div className="page-head__inner">
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
        </div>
      </header>

      <section className="about__block" aria-labelledby="about-what">
        <h2 id="about-what">{t('about.what.title')}</h2>
        <p className="about__lead">{t('about.what.text')}</p>
        <ul className="about__facts">
          <li>
            <strong className="num">{disasters.length}</strong>
            <span>{t('home.stats.disasters')}</span>
          </li>
          <li>
            <strong className="num">{languages.length}</strong>
            <span>{t('home.stats.languages')}</span>
          </li>
          <li>
            <strong aria-hidden="true">
              <UiIcon name="wifi-off" size={22} />
            </strong>
            <span>{t('home.stats.offline')}</span>
          </li>
        </ul>
      </section>

      <section className="about__block" aria-labelledby="about-why">
        <h2 id="about-why">{t('about.why.title')}</h2>
        <p>{t('about.why.text')}</p>
      </section>

      <section className="about__block" aria-labelledby="about-who">
        <h2 id="about-who">{t('about.who.title')}</h2>
        <ul className="about__list about__list--icons">
          {whoItems.map((item, index) => (
            <li key={item}>
              <span className="about__icon" aria-hidden="true">
                <SafetyIcon name={WHO_ICONS[index % WHO_ICONS.length]} size={22} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about__block" aria-labelledby="about-how">
        <h2 id="about-how">{t('about.how.title')}</h2>
        <ol className="about__list about__list--steps">
          {howItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="about__block about__block--limits" aria-labelledby="about-limits">
        <h2 id="about-limits">{t('about.limits.title')}</h2>
        <ul className="about__list about__list--limits">
          {limitItems.map((item) => (
            <li key={item}>
              <span className="about__icon about__icon--stop" aria-hidden="true">
                <SafetyIcon name="no-entry" size={20} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about__block" aria-labelledby="about-stack">
        <h2 id="about-stack">{t('about.stack.title')}</h2>
        <ul className="about__list about__list--plain">
          {stackItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="about__block" aria-labelledby="about-sources">
        <h2 id="about-sources">{t('about.sources.title')}</h2>
        <p>{t('about.sources.text')}</p>
        <p className="about__reviewed">
          {t('about.sources.reviewed')}:{' '}
          <span className="num">{contactsMeta.lastReviewed}</span>
        </p>
      </section>

      <section className="about__disclaimer" aria-labelledby="about-disclaimer">
        <h2 id="about-disclaimer" className="sr-only">
          {t('disclaimer.short')}
        </h2>
        <p>
          <SafetyIcon name="warning-triangle" size={20} />
          <span>{t('disclaimer.full')}</span>
        </p>
        <p className="about__hackathon">{t('about.hackathon')}</p>
      </section>

      <div className="about__actions">
        <Link to="/ai" className="btn">
          <UiIcon name="spark" size={20} />
          {t('home.hero.ctaAi')}
        </Link>
        <Link to="/emergency" className="btn btn--secondary">
          <SafetyIcon name="phone-call" size={20} />
          {t('home.hero.ctaEmergency')}
        </Link>
      </div>
    </div>
  );
}
