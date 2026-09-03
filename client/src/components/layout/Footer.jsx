import { Link } from 'react-router-dom';
import { contacts } from '../../data';
import { useLanguage } from '../../i18n/LanguageProvider';
import UiIcon from '../UiIcon';
import './Footer.css';

const SECTIONS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/ai', labelKey: 'nav.ai' },
  { to: '/emergency', labelKey: 'nav.emergency' },
  { to: '/about', labelKey: 'nav.about' },
];

export default function Footer() {
  const { t, localize } = useLanguage();

  // The three most broadly useful numbers; the full verified list lives on the
  // Emergency page with its sources.
  const quickContacts = contacts.slice(0, 3);

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <span className="site-footer__mark">
            <UiIcon name="logo" size={22} />
          </span>
          <div>
            <strong>{t('app.name')}</strong>
            <p>{t('app.tagline')}</p>
          </div>
        </div>

        <nav className="site-footer__col" aria-label={t('footer.sections')}>
          <h2 className="site-footer__heading">{t('footer.sections')}</h2>
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.to}>
                <Link to={section.to}>{t(section.labelKey)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__col">
          <h2 className="site-footer__heading">{t('footer.emergencyNumbers')}</h2>
          <ul>
            {quickContacts.map((contact) => (
              <li key={contact.id}>
                <a
                  href={`tel:${contact.number}`}
                  className="site-footer__tel"
                  aria-label={t('emergency.contacts.callAria', {
                    name: localize(contact.name),
                    number: contact.number,
                  })}
                >
                  <span>{localize(contact.name)}</span>
                  <strong className="tel">{contact.number}</strong>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer__col">
          <h2 className="site-footer__heading">{t('footer.safety')}</h2>
          <p className="site-footer__disclaimer">{t('disclaimer.full')}</p>
        </div>
      </div>

      <div className="container site-footer__meta">
        <p>{t('footer.builtFor')}</p>
        <p>{t('footer.poweredBy')}</p>
        <p>{t('footer.rights')}</p>
      </div>
    </footer>
  );
}
