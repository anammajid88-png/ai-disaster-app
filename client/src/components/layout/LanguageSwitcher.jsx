import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import UiIcon from '../UiIcon';
import './LanguageSwitcher.css';

/**
 * Language menu.
 *
 * Each option is labelled in its own script (English / اردو / हिन्दी) so a user
 * who cannot read the current interface language can still find their own.
 */
export default function LanguageSwitcher({ align = 'end' }) {
  const { language, languages, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  const current = languages.find((item) => item.code === language);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (code) => {
    setLanguage(code);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className={`lang lang--${align}`} ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        className="lang__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t('lang.select')}: ${current.nativeLabel}`}
      >
        <UiIcon name="globe" size={20} />
        <span className="lang__current">{current.nativeLabel}</span>
        <UiIcon name="chevron-down" size={16} className={open ? 'lang__caret is-open' : 'lang__caret'} />
      </button>

      {open ? (
        <ul className="lang__menu" role="menu" aria-label={t('lang.select')}>
          {languages.map((item) => (
            <li key={item.code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={item.code === language}
                className={item.code === language ? 'lang__option is-active' : 'lang__option'}
                lang={item.htmlLang}
                dir={item.dir}
                onClick={() => choose(item.code)}
              >
                <span className="lang__native">{item.nativeLabel}</span>
                <span className="lang__latin">{item.label}</span>
                {item.code === language ? <UiIcon name="check" size={18} /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
