import { useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import UiIcon from '../UiIcon';

const MAX_LENGTH = 1000; // Mirrors MAX_MESSAGE_LENGTH in the backend validator.

/**
 * Message composer.
 *
 * Typing is the primary path and always works. The microphone is an optional
 * enhancement: it is only rendered when the browser supports recognition, and
 * any failure is reported as a short line under the field.
 */
export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  busy,
  mic,
  micLocale,
}) {
  const { t } = useLanguage();
  const textareaRef = useRef(null);

  // Grow with the text instead of showing a scrollbar in a 2-line box.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [value]);

  const submit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const onKeyDown = (event) => {
    // Enter sends, Shift+Enter adds a line.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const micError = mic.error ? t(`chat.mic.${mic.error}`) : null;

  return (
    <form className="composer" onSubmit={submit}>
      <div className={mic.listening ? 'composer__field is-listening' : 'composer__field'}>
        <label htmlFor="chat-input" className="sr-only">
          {t('chat.placeholder')}
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          className="composer__input"
          rows={1}
          maxLength={MAX_LENGTH}
          value={value}
          lang={micLocale}
          dir="auto"
          placeholder={mic.listening ? t('chat.placeholderListening') : t('chat.placeholder')}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />

        {mic.supported ? (
          <button
            type="button"
            className={mic.listening ? 'composer__mic is-active' : 'composer__mic'}
            onClick={mic.toggle}
            aria-pressed={mic.listening}
            aria-label={t(mic.listening ? 'chat.mic.stop' : 'chat.mic.start')}
          >
            <UiIcon name={mic.listening ? 'mic-off' : 'mic'} size={22} />
          </button>
        ) : null}

        <button
          type="submit"
          className="composer__send"
          disabled={busy || !value.trim()}
          aria-label={t('chat.send')}
        >
          <UiIcon name="send" size={20} />
        </button>
      </div>

      {micError ? (
        <p className="composer__error" role="status">
          {micError}
        </p>
      ) : null}
    </form>
  );
}
