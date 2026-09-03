import { useMemo, useState } from 'react';
import ContactCard from '../components/ContactCard';
import SafetyIcon from '../components/SafetyIcon';
import UiIcon from '../components/UiIcon';
import { contacts, contactsMeta, kitItems, kitMeta } from '../data';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../i18n/LanguageProvider';
import './Emergency.css';

const TABS = ['contacts', 'kit', 'location'];

/* ------------------------------------------------------------------ Kit */

function EmergencyKit() {
  const { t, localize } = useLanguage();
  const [checked, setChecked, resetChecked] = useLocalStorage('ai-disaster-app:kit', {});

  const done = useMemo(
    () => kitItems.filter((item) => checked[item.id]).length,
    [checked]
  );

  const toggle = (id) =>
    setChecked((current) => ({ ...current, [id]: !current[id] }));

  const reset = () => {
    if (done > 0 && !window.confirm(t('kit.resetConfirm'))) return;
    resetChecked();
  };

  const percent = Math.round((done / kitItems.length) * 100);

  return (
    <section className="kit" aria-labelledby="kit-title">
      <div className="kit__head">
        <div>
          <h2 id="kit-title">{t('kit.title')}</h2>
          <p>{t('kit.subtitle')}</p>
        </div>
        <div className="kit__progress">
          <strong className="num">{t('kit.progress', { done, total: kitItems.length })}</strong>
          <div
            className="kit__bar"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={kitItems.length}
            aria-label={t('kit.title')}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {done === kitItems.length ? (
        <p className="note note--success kit__complete">
          <UiIcon name="check" size={18} />
          <span>{t('kit.complete')}</span>
        </p>
      ) : null}

      <ul className="kit__list">
        {kitItems.map((item) => {
          const isChecked = Boolean(checked[item.id]);

          return (
            <li key={item.id}>
              <label className={isChecked ? 'kit__item is-checked' : 'kit__item'}>
                <input
                  type="checkbox"
                  className="kit__checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  aria-label={t('kit.itemAria', { item: localize(item.label) })}
                />
                <span className="kit__box" aria-hidden="true">
                  <UiIcon name="check" size={18} />
                </span>
                <span className="kit__icon" aria-hidden="true">
                  <SafetyIcon name={item.icon} size={22} />
                </span>
                <span className="kit__text">
                  <strong>
                    {localize(item.label)}
                    {item.essential ? (
                      <span className="kit__essential">{t('kit.essential')}</span>
                    ) : null}
                  </strong>
                  <span>{localize(item.detail)}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="kit__foot">
        <p className="kit__note">
          {t('kit.recommendedFor')}: {localize(kitMeta.recommendedFor)} &middot; {t('kit.note')}
        </p>
        <button type="button" className="btn btn--sm btn--secondary" onClick={reset}>
          <UiIcon name="trash" size={18} />
          {t('kit.reset')}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Location */

function LocationPanel() {
  const { t } = useLanguage();
  const { supported, status, position, errorKey, request } = useGeolocation();
  const [copied, setCopied] = useState(false);

  const coordinates = position
    ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
    : null;

  const copy = async () => {
    if (!coordinates) return;
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the coordinates are on screen and can be read out.
    }
  };

  return (
    <section className="loc" aria-labelledby="loc-title">
      <h2 id="loc-title">{t('location.title')}</h2>
      <p className="loc__subtitle">{t('location.subtitle')}</p>

      {!supported ? (
        <p className="note note--warn">
          <UiIcon name="info" size={18} />
          <span>{t('location.unsupported')}</span>
        </p>
      ) : (
        <>
          <button
            type="button"
            className="btn"
            onClick={request}
            disabled={status === 'loading'}
          >
            <UiIcon name="location" size={20} />
            {status === 'loading'
              ? t('location.loading')
              : t(status === 'error' ? 'location.retry' : 'location.get')}
          </button>

          {status === 'error' && errorKey ? (
            <p className="note note--warn loc__message" role="status">
              <UiIcon name="info" size={18} />
              <span>{t(`location.${errorKey}`)}</span>
            </p>
          ) : null}

          {status === 'success' && position ? (
            <div className="loc__result" role="status">
              <dl>
                <div>
                  <dt>{t('location.coordinates')}</dt>
                  <dd className="num loc__coords">{coordinates}</dd>
                </div>
                <div>
                  <dt>{t('location.accuracy')}</dt>
                  <dd className="num">
                    {t('location.accuracyValue', { meters: Math.round(position.accuracy) })}
                  </dd>
                </div>
              </dl>
              <button type="button" className="btn btn--sm btn--secondary" onClick={copy}>
                <UiIcon name={copied ? 'check' : 'copy'} size={18} />
                {t(copied ? 'location.copied' : 'location.copy')}
              </button>
            </div>
          ) : null}
        </>
      )}

      <p className="loc__note">{t('location.note')}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ Page */

export default function Emergency() {
  const { t, localize } = useLanguage();
  const [tab, setTab] = useState('contacts');

  useDocumentMeta({
    title: t('emergency.title'),
    description: t('emergency.subtitle'),
    path: '/emergency',
  });

  const onTabKeyDown = (event) => {
    const index = TABS.indexOf(tab);
    let next = null;

    if (event.key === 'ArrowRight') next = TABS[(index + 1) % TABS.length];
    if (event.key === 'ArrowLeft') next = TABS[(index - 1 + TABS.length) % TABS.length];

    if (next) {
      event.preventDefault();
      setTab(next);
      document.getElementById(`e-tab-${next}`)?.focus();
    }
  };

  return (
    <div className="container emergency">
      <header className="page-head">
        <div className="page-head__inner">
          <h1>{t('emergency.title')}</h1>
          <p>{t('emergency.subtitle')}</p>
        </div>
      </header>

      <div className="e-tabs" role="tablist" aria-label={t('emergency.title')}>
        {TABS.map((key) => (
          <button
            key={key}
            id={`e-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls={`e-panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
            className={tab === key ? 'e-tabs__btn is-active' : 'e-tabs__btn'}
            onClick={() => setTab(key)}
            onKeyDown={onTabKeyDown}
          >
            {t(`emergency.tabs.${key}`)}
          </button>
        ))}
      </div>

      <div id={`e-panel-${tab}`} role="tabpanel" aria-labelledby={`e-tab-${tab}`} className="e-panel">
        {tab === 'contacts' ? (
          <section aria-labelledby="contacts-title">
            <h2 id="contacts-title">{t('emergency.contacts.title')}</h2>
            <p className="e-panel__intro">{t('emergency.contacts.subtitle')}</p>

            <p className="note note--warn">
              <SafetyIcon name="warning-triangle" size={18} />
              <span>{localize(contactsMeta.warning)}</span>
            </p>

            <div className="grid grid--cards e-contacts">
              {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>

            <p className="e-panel__note">{t('emergency.contacts.note')}</p>
            <p className="e-panel__note">
              {t('about.sources.reviewed')}: <span className="num">{contactsMeta.lastReviewed}</span>
            </p>
          </section>
        ) : null}

        {tab === 'kit' ? <EmergencyKit /> : null}
        {tab === 'location' ? <LocationPanel /> : null}
      </div>
    </div>
  );
}
