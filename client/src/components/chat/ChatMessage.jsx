import { useLanguage } from '../../i18n/LanguageProvider';
import { disastersById } from '../../data';
import SafetyIcon from '../SafetyIcon';
import UiIcon from '../UiIcon';

/**
 * Splits an answer into displayable lines.
 *
 * Both Qwen and the stored fallback answer with short lines, often numbered.
 * Numbered lines get their own style so steps stay scannable under stress.
 */
function toLines(text) {
  return String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      key: `${index}-${line.slice(0, 12)}`,
      text: line,
      isStep: /^\d+[.)]/.test(line),
    }));
}

export default function ChatMessage({ message, onSpeak, onStopSpeak, speakingId, speechSupported }) {
  const { t, localize } = useLanguage();

  if (message.role === 'user') {
    return (
      <li className="msg msg--user">
        <p className="msg__role">{t('chat.you')}</p>
        <div className="msg__bubble">{message.text}</div>
      </li>
    );
  }

  const isSpeaking = speakingId === message.id;
  const isFallback = message.source === 'fallback';
  const disaster = message.disasterType ? disastersById[message.disasterType] : null;

  return (
    <li className="msg msg--assistant">
      <p className="msg__role">
        <span className="msg__avatar" aria-hidden="true">
          <UiIcon name="logo" size={16} />
        </span>
        {t('chat.assistant')}
        <span
          className={isFallback ? 'msg__source msg__source--fallback' : 'msg__source'}
          title={t(isFallback ? 'chat.source.fallbackTitle' : 'chat.source.aiTitle')}
        >
          {t(isFallback ? 'chat.source.fallback' : 'chat.source.ai')}
        </span>
      </p>

      <div className="msg__bubble">
        {message.urgency === 'high' ? (
          <p className="msg__urgent">
            <SafetyIcon name="warning-triangle" size={18} />
            {t('chat.urgent')}
          </p>
        ) : null}

        {message.notice ? (
          <p className="msg__notice">
            <UiIcon name="info" size={16} />
            {t(message.notice.messageKey)}
          </p>
        ) : null}

        <div className="msg__text">
          {toLines(message.text).map((line) => (
            <p key={line.key} className={line.isStep ? 'msg__step' : undefined}>
              {line.text}
            </p>
          ))}
        </div>

        <div className="msg__meta">
          {disaster ? (
            <span className="msg__tag">
              <SafetyIcon name="checklist" size={14} />
              {t('chat.detected', { disaster: localize(disaster.content).name })}
            </span>
          ) : null}

          {speechSupported ? (
            <button
              type="button"
              className="msg__listen"
              onClick={() => (isSpeaking ? onStopSpeak() : onSpeak(message.text, message.id))}
              aria-pressed={isSpeaking}
            >
              <UiIcon name={isSpeaking ? 'speaker-off' : 'speaker'} size={18} />
              {t(isSpeaking ? 'chat.speak.stop' : 'chat.speak.listen')}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
