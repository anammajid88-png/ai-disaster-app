import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import UiIcon from '../UiIcon';

/**
 * PWA install prompt.
 *
 * Uses the browser's own `beforeinstallprompt` event, so the card only appears
 * on browsers that can actually install the app and have not installed it yet.
 * "Not now" is remembered so the card never nags.
 */
export default function InstallPrompt() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useLocalStorage('ai-disaster-app:install-dismissed', false);
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setInstallEvent(null));
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!installEvent || dismissed) return null;

  const install = async () => {
    try {
      await installEvent.prompt();
    } catch {
      // The user closed the native dialog; nothing to report.
    }
    setInstallEvent(null);
  };

  return (
    <aside className="install-prompt" aria-label={t('common.install')}>
      <span className="install-prompt__icon">
        <UiIcon name="download" size={20} />
      </span>
      <div className="install-prompt__body">
        <p>{t('common.installText')}</p>
        <div className="install-prompt__actions">
          <button type="button" className="btn btn--sm" onClick={install}>
            {t('common.install')}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setDismissed(true)}
          >
            {t('common.dismiss')}
          </button>
        </div>
      </div>
    </aside>
  );
}
