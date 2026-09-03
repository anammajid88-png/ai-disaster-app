import { useLanguage } from '../../i18n/LanguageProvider';
import { useOnlineStatus } from '../../hooks/useAppStatus';
import UiIcon from '../UiIcon';
import './Banners.css';

/**
 * Always-visible short disclaimer.
 * The full wording is repeated in the footer and on the About page.
 */
export function DisclaimerBar() {
  const { t } = useLanguage();

  return (
    <div className="disclaimer-bar">
      <div className="container disclaimer-bar__inner">
        <UiIcon name="shield" size={18} />
        <p>{t('disclaimer.short')}</p>
      </div>
    </div>
  );
}

/**
 * Offline notice.
 *
 * Deliberately worded as a limitation plus what still works, because stored
 * guidance, emergency numbers and the kit genuinely do work without a network.
 */
export function OfflineBanner() {
  const { t } = useLanguage();
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div className="container offline-banner__inner">
        <UiIcon name="wifi-off" size={20} />
        <p>{t('status.offline')}</p>
      </div>
    </div>
  );
}
