import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageProvider';
import DisasterIllustration from './DisasterIllustration';
import UiIcon from './UiIcon';
import './DisasterCard.css';

/**
 * One disaster category.
 *
 * Two explicit actions rather than a clickable card, so keyboard users get a
 * predictable focus order and screen readers announce both choices.
 */
export default function DisasterCard({ disaster, onOpenGuidelines }) {
  const { t, localize } = useLanguage();
  const content = localize(disaster.content);

  return (
    <article className="d-card" style={{ '--accent': disaster.accent, '--accent-soft': disaster.accentSoft }}>
      <div className="d-card__visual">
        <DisasterIllustration disaster={disaster} />
        <span className={`d-card__risk d-card__risk--${disaster.riskLevel}`}>
          {t(`disaster.risk.${disaster.riskLevel}`)}
        </span>
      </div>

      <div className="d-card__body">
        <h3 className="d-card__title">{content.name}</h3>
        <p className="d-card__tagline">{content.tagline}</p>

        <span className="d-card__season">{t(`disaster.season.${disaster.season}`)}</span>

        <div className="d-card__actions">
          <button
            type="button"
            className="btn btn--block"
            onClick={() => onOpenGuidelines(disaster.id)}
          >
            {t('disaster.viewGuidelines')}
          </button>
          <Link
            to={`/ai?q=${encodeURIComponent(content.name)}`}
            className="btn btn--secondary btn--block btn--sm"
          >
            <UiIcon name="spark" size={18} />
            {t('disaster.askAi')}
          </Link>
        </div>
      </div>
    </article>
  );
}
