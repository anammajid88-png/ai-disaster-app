import { useLanguage } from '../i18n/LanguageProvider';
import SafetyIcon from './SafetyIcon';
import UiIcon from './UiIcon';
import './ContactCard.css';

/**
 * A verified emergency contact.
 *
 * The number itself is never generated or guessed - it comes straight from
 * shared/data/emergencyContacts.json, together with the organisation and the
 * date it was verified, which the full variant shows.
 *
 * "Call" is a plain tel: link: it opens the dialler. The app never places a
 * call and never contacts a service on the user's behalf.
 */
export default function ContactCard({ contact, variant = 'full' }) {
  const { t, localize } = useLanguage();

  const name = localize(contact.name);
  const callAria = t('emergency.contacts.callAria', { name, number: contact.number });

  if (variant === 'compact') {
    return (
      <a href={`tel:${contact.number}`} className="contact-compact" aria-label={callAria}>
        <span className="contact-compact__icon">
          <SafetyIcon name={contact.icon} size={22} />
        </span>
        <span className="contact-compact__text">
          <strong>{name}</strong>
          <span className="contact-compact__type">{localize(contact.type)}</span>
        </span>
        <span className="contact-compact__number tel">{contact.number}</span>
      </a>
    );
  }

  return (
    <article className="contact-card">
      <div className="contact-card__head">
        <span className="contact-card__icon">
          <SafetyIcon name={contact.icon} size={26} />
        </span>
        <div className="contact-card__id">
          <h3>{name}</h3>
          <p>{localize(contact.type)}</p>
        </div>
        <span className="contact-card__number tel" aria-hidden="true">
          {contact.number}
        </span>
      </div>

      <dl className="contact-card__facts">
        <div>
          <dt>{t('emergency.contacts.useWhen')}</dt>
          <dd>{localize(contact.useWhen)}</dd>
        </div>
        <div>
          <dt>{t('emergency.contacts.coverage')}</dt>
          <dd>{localize(contact.coverage)}</dd>
        </div>
      </dl>

      <a href={`tel:${contact.number}`} className="btn btn--block" aria-label={callAria}>
        <SafetyIcon name="phone-call" size={20} />
        <span>
          {t('emergency.contacts.call')} <span className="tel">{contact.number}</span>
        </span>
      </a>

      <p className="contact-card__source">
        {contact.verified ? (
          <span className="badge badge--success">
            <UiIcon name="check" size={14} />
            {t('emergency.contacts.verified')}
          </span>
        ) : null}
        <span>
          {t('emergency.contacts.source')}: {contact.source.organisation} &middot;{' '}
          <span className="num">{contact.source.verifiedOn}</span>
        </span>
      </p>
    </article>
  );
}
