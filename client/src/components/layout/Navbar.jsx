import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageProvider';
import UiIcon from '../UiIcon';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const LINKS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/ai', labelKey: 'nav.ai' },
  { to: '/emergency', labelKey: 'nav.emergency' },
  { to: '/about', labelKey: 'nav.about' },
];

export default function Navbar() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);

  // Route change closes the mobile panel.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label={t('app.name')}>
          <span className="brand__mark">
            <UiIcon name="logo" size={24} />
          </span>
          <span className="brand__text">
            <strong>{t('app.name')}</strong>
            <small>{t('home.hero.badge')}</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label={t('nav.primary')}>
          <ul className="site-nav__list">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => (isActive ? 'site-nav__link is-active' : 'site-nav__link')}
                >
                  {t(link.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <LanguageSwitcher />
          <button
            ref={toggleRef}
            type="button"
            className="site-header__toggle"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            <UiIcon name={menuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile panel: a plain list, large targets, no nested menus. */}
      <div id="mobile-nav" className={menuOpen ? 'mobile-nav is-open' : 'mobile-nav'} hidden={!menuOpen}>
        <nav className="container" aria-label={t('nav.primary')}>
          <ul className="mobile-nav__list">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    isActive ? 'mobile-nav__link is-active' : 'mobile-nav__link'
                  }
                >
                  <span>{t(link.labelKey)}</span>
                  <UiIcon name="chevron-right" size={18} className="icon-flip" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
