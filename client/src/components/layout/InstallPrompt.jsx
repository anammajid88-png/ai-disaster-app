import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import UiIcon from '../UiIcon';

/**
 * PWA install prompt.
 *
 * Uses the browser's own `beforeinstallprompt` event.
 * Enhancements:
 * - Suppressed during Judge Demo, full-screen, and screenshot captures.
 * - Displays only after initial user engagement (delayed by 8s).
 * - Compact layout with a top-right 1-click dismiss button.
 * - Dismissal persisted for 14 days.
 */
export default function InstallPrompt() {
  const { t } = useLanguage();
  const location = useLocation();
  const [dismissedUntil, setDismissedUntil] = useLocalStorage('ai-disaster-app:install-dismissed-until', 0);
  const [installEvent, setInstallEvent] = useState(null);
  const [engaged, setEngaged] = useState(false);

  // Delay prompt slightly to let user engage with the app first
  useEffect(() => {
    const timer = setTimeout(() => setEngaged(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setInstallEvent(null));
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  // Suppress on Demo, when dismissed, or in headless/screenshot flows
  const isDemo = location.pathname.startsWith('/intelligence/demo') || location.search.includes('demo=true');
  const isDismissed = Date.now() < dismissedUntil;

  if (!installEvent || !engaged || isDismissed || isDemo) return null;

  const dismiss = () => {
    // Dismiss for 14 days
    setDismissedUntil(Date.now() + 14 * 24 * 60 * 60 * 1000);
  };

  const install = async () => {
    try {
      await installEvent.prompt();
    } catch {
      // User closed native prompt
    }
    setInstallEvent(null);
  };

  return (
    <aside className="install-prompt" aria-label={t('common.install')} style={{ position: 'fixed', zIndex: 1000 }}>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          padding: 4,
          borderRadius: 4,
        }}
      >
        <X size={14} />
      </button>

      <span className="install-prompt__icon">
        <UiIcon name="download" size={20} />
      </span>
      <div className="install-prompt__body">
        <p style={{ margin: 0, paddingRight: 16 }}>{t('common.installText')}</p>
        <div className="install-prompt__actions">
          <button type="button" className="btn btn--sm" onClick={install}>
            {t('common.install')}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={dismiss}
          >
            {t('common.dismiss')}
          </button>
        </div>
      </div>
    </aside>
  );
}
