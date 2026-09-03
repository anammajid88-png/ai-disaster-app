import { Link } from 'react-router-dom';
import SafetyIcon from '../components/SafetyIcon';
import UiIcon from '../components/UiIcon';
import { contacts } from '../data';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLanguage } from '../i18n/LanguageProvider';
import './NotFound.css';

export default function NotFound() {
  const { t, localize } = useLanguage();

  useDocumentMeta({
    title: t('errors.pageTitle'),
    description: t('errors.pageText'),
  });

  /* A wrong URL is still a moment where someone may need a number fast. */
  const quickContacts = contacts.slice(0, 3);

  return (
    <div className="container notfound">
      <div className="notfound__icon" aria-hidden="true">
        <SafetyIcon name="no-entry" size={44} />
      </div>

      <h1>{t('errors.pageTitle')}</h1>
      <p className="notfound__text">{t('errors.pageText')}</p>

      <div className="notfound__actions">
        <Link to="/" className="btn">
          <UiIcon name="arrow-right" size={20} className="icon-flip" />
          {t('errors.goHome')}
        </Link>
        <Link to="/emergency" className="btn btn--secondary">
          <SafetyIcon name="phone-call" size={20} />
          {t('home.hero.ctaEmergency')}
        </Link>
      </div>

      <div className="notfound__calls">
        <h2>{t('footer.emergencyNumbers')}</h2>
        <ul>
          {quickContacts.map((contact) => (
            <li key={contact.id}>
              <a
                href={`tel:${contact.number}`}
                className="btn btn--sm btn--danger"
                aria-label={t('emergency.contacts.callAria', {
                  name: localize(contact.name),
                  number: contact.number,
                })}
              >
                <SafetyIcon name={contact.icon} size={18} />
                <span>
                  {localize(contact.name)} <span className="tel">{contact.number}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="notfound__disclaimer">{t('disclaimer.short')}</p>
    </div>
  );
}
