import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContactsForDisaster } from '../data';
import { useLanguage } from '../i18n/LanguageProvider';
import ContactCard from './ContactCard';
import DisasterIllustration from './DisasterIllustration';
import SafetyIcon from './SafetyIcon';
import UiIcon from './UiIcon';
import './GuidelinesModal.css';

const TABS = ['before', 'during', 'after', 'avoid'];

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

/** One numbered safety step. */
function Step({ step, sectionKey }) {
  const { t } = useLanguage();

  return (
    <li className={`g-step g-step--${step.priority}`}>
      <span className="g-step__num" aria-hidden="true">
        {step.step}
      </span>
      <span className="g-step__icon">
        <SafetyIcon name={step.icon} size={24} />
      </span>
      <div className="g-step__body">
        <h4 className="g-step__title">{step.title}</h4>
        <p className="g-step__text">{step.text}</p>
      </div>
      {step.priority !== 'normal' ? (
        <span className={`g-step__flag g-step__flag--${step.priority}`}>
          {t(`guidelines.priority.${step.priority}`)}
        </span>
      ) : null}
      <span className="sr-only">
        {t('guidelines.step')} {step.step} - {t(`guidelines.${sectionKey}`)}
      </span>
    </li>
  );
}

/**
 * Guidelines dialog.
 *
 * Order is deliberate and matches how the information is needed under stress:
 * the immediate actions are on screen without any interaction, the verified
 * numbers come next, and the fuller Before / During / After / Avoid guidance
 * sits behind tabs so the panel stays scannable.
 */
export default function GuidelinesModal({ disaster, onClose }) {
  const { t, localize } = useLanguage();
  const [tab, setTab] = useState('during');
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(null);

  const content = localize(disaster.content);
  const contacts = useMemo(() => getContactsForDisaster(disaster.id), [disaster.id]);

  // Remember where focus came from, move it into the dialog, then restore it.
  useEffect(() => {
    openerRef.current = document.activeElement;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      // Keep Tab inside the dialog.
      const nodes = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || []).filter(
        (node) => node.offsetParent !== null
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  /** Left/right arrows move between tabs, as expected of a tablist. */
  const onTabKeyDown = (event) => {
    const index = TABS.indexOf(tab);
    let next = null;

    if (event.key === 'ArrowRight') next = TABS[(index + 1) % TABS.length];
    if (event.key === 'ArrowLeft') next = TABS[(index - 1 + TABS.length) % TABS.length];
    if (event.key === 'Home') next = TABS[0];
    if (event.key === 'End') next = TABS[TABS.length - 1];

    if (next) {
      event.preventDefault();
      setTab(next);
      dialogRef.current?.querySelector(`#g-tab-${next}`)?.focus();
    }
  };

  return (
    <div
      className="g-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="g-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="g-title"
        aria-describedby="g-desc"
        ref={dialogRef}
        onKeyDown={onKeyDown}
        style={{ '--accent': disaster.accent, '--accent-soft': disaster.accentSoft }}
      >
        <header className="g-modal__head">
          <div className="g-modal__art" aria-hidden="true">
            <DisasterIllustration disaster={disaster} />
          </div>
          <div className="g-modal__heading">
            <p className="g-modal__eyebrow">{t('guidelines.dialogLabel')}</p>
            <h2 id="g-title">{content.name}</h2>
            <p id="g-desc">{content.description}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="g-modal__close"
            onClick={onClose}
            aria-label={t('guidelines.close')}
          >
            <UiIcon name="close" size={22} />
          </button>
        </header>

        <div className="g-modal__body">
          {/* Immediate action - never hidden behind a tab. */}
          <section className="g-now" aria-labelledby="g-now-title">
            <h3 id="g-now-title" className="g-now__title">
              <SafetyIcon name="warning-triangle" size={22} />
              {t('guidelines.rightNow')}
            </h3>
            <ol className="g-steps">
              {content.rightNow.map((step) => (
                <Step key={`now-${step.step}`} step={step} sectionKey="rightNow" />
              ))}
            </ol>
          </section>

          <section className="g-calls" aria-labelledby="g-calls-title">
            <h3 id="g-calls-title" className="g-section__title">
              {t('guidelines.callSection')}
            </h3>
            <div className="g-calls__list">
              {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} variant="compact" />
              ))}
            </div>
            <p className="g-calls__note">{t('emergency.contacts.note')}</p>
          </section>

          <section className="g-tabs" aria-labelledby="g-tabs-title">
            <h3 id="g-tabs-title" className="sr-only">
              {t('guidelines.sections')}
            </h3>
            <div className="g-tabs__bar" role="tablist" aria-label={t('guidelines.sections')}>
              {TABS.map((key) => (
                <button
                  key={key}
                  id={`g-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  aria-controls={`g-panel-${key}`}
                  tabIndex={tab === key ? 0 : -1}
                  className={tab === key ? 'g-tabs__btn is-active' : 'g-tabs__btn'}
                  onClick={() => setTab(key)}
                  onKeyDown={onTabKeyDown}
                >
                  {t(`guidelines.${key}`)}
                </button>
              ))}
            </div>

            <div
              id={`g-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`g-tab-${tab}`}
              tabIndex={0}
              className="g-tabs__panel"
            >
              <ol className={tab === 'avoid' ? 'g-steps g-steps--avoid' : 'g-steps'}>
                {content[tab].map((step) => (
                  <Step key={`${tab}-${step.step}`} step={step} sectionKey={tab} />
                ))}
              </ol>
            </div>
          </section>
        </div>

        <footer className="g-modal__foot">
          <Link
            to={`/ai?q=${encodeURIComponent(content.name)}`}
            className="btn"
            onClick={onClose}
          >
            <UiIcon name="spark" size={18} />
            {t('guidelines.askAi')}
          </Link>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
}
