import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatComposer from '../components/chat/ChatComposer';
import ChatMessage from '../components/chat/ChatMessage';
import SafetyIcon from '../components/SafetyIcon';
import UiIcon from '../components/UiIcon';
import { useOnlineStatus, useAiStatus } from '../hooks/useAppStatus';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useLanguage } from '../i18n/LanguageProvider';
import { ApiError, sendChatMessage } from '../services/api';
import './AiHelp.css';

/** Turns per request. Enough for context, small enough to stay fast and cheap. */
const HISTORY_TURNS = 6;

let messageCounter = 0;
const nextId = () => {
  messageCounter += 1;
  return `m${messageCounter}`;
};

export default function AiHelp() {
  const { t, language, languageMeta } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const online = useOnlineStatus();
  const aiStatus = useAiStatus(online);
  const listRef = useRef(null);

  useDocumentMeta({
    title: t('chat.title'),
    description: t('chat.subtitle'),
    path: '/ai',
  });

  const speech = useSpeechSynthesis({
    locale: languageMeta.speechLocale,
    fallbacks: languageMeta.speechFallbacks,
  });

  const mic = useSpeechRecognition({
    locale: languageMeta.speechLocale,
    onResult: (transcript) =>
      setInput((current) => (current ? `${current} ${transcript}` : transcript)),
  });

  const send = useCallback(
    async (rawText) => {
      const text = String(rawText ?? '').trim();
      if (!text || busy) return;

      const history = messages
        .slice(-HISTORY_TURNS * 2)
        .map((message) => ({ role: message.role, content: message.text }));

      setMessages((current) => [...current, { id: nextId(), role: 'user', text }]);
      setInput('');
      setErrorKey(null);
      setBusy(true);

      try {
        const payload = await sendChatMessage({ message: text, language, history });

        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            text: payload.answer,
            source: payload.source,
            notice: payload.notice,
            disasterType: payload.disasterType,
            urgency: payload.urgency,
          },
        ]);
      } catch (error) {
        setErrorKey(error instanceof ApiError ? error.messageKey : 'errors.server');
      } finally {
        setBusy(false);
      }
    },
    [busy, language, messages]
  );

  // A disaster card or the guidelines dialog can arrive with ?q=<disaster name>.
  useEffect(() => {
    const prefill = searchParams.get('q');
    if (!prefill) return;

    setInput(prefill);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Keep the newest message in view without yanking the whole page.
  useEffect(() => {
    if (messages.length === 0) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  const clear = () => {
    if (messages.length > 0 && !window.confirm(t('chat.clearConfirm'))) return;
    speech.stop();
    setMessages([]);
    setErrorKey(null);
  };

  const suggestions = useMemo(() => t('chat.suggestions.items'), [t]);

  const statusLabel = aiStatus.loading
    ? t('status.checking')
    : t(aiStatus.configured ? 'status.aiReady' : 'status.aiFallback');

  return (
    <div className="container chat-page">
      <header className="page-head">
        <div className="page-head__inner">
          <h1>{t('chat.title')}</h1>
          <p>{t('chat.subtitle')}</p>
        </div>
      </header>

      <div className="chat">
        <div className="chat__bar">
          <span
            className={
              aiStatus.configured && online ? 'chat__status is-live' : 'chat__status is-stored'
            }
          >
            <span className="chat__dot" aria-hidden="true" />
            {statusLabel}
          </span>

          {messages.length > 0 ? (
            <button type="button" className="btn btn--sm btn--ghost" onClick={clear}>
              <UiIcon name="trash" size={18} />
              {t('chat.clear')}
            </button>
          ) : null}
        </div>

        <div className="chat__scroll" ref={listRef}>
          {messages.length === 0 ? (
            <div className="chat__empty">
              <span className="chat__empty-icon">
                <UiIcon name="spark" size={26} />
              </span>
              <h2>{t('chat.empty.title')}</h2>
              <p>{t('chat.empty.text')}</p>
            </div>
          ) : (
            <ul className="chat__list">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSpeak={speech.speak}
                  onStopSpeak={speech.stop}
                  speakingId={speech.speakingId}
                  speechSupported={speech.supported}
                />
              ))}
            </ul>
          )}

          {busy ? (
            <p className="chat__typing" role="status" aria-live="polite">
              <span className="chat__typing-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {t('chat.typing')}
            </p>
          ) : null}
        </div>

        {errorKey ? (
          <div className="note note--danger chat__error" role="alert">
            <SafetyIcon name="warning-triangle" size={18} />
            <span>{t(errorKey)}</span>
          </div>
        ) : null}

        <div className="chat__foot">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={() => send(input)}
            busy={busy}
            mic={mic}
            micLocale={languageMeta.htmlLang}
          />

          {!speech.supported ? (
            <p className="chat__capability">{t('chat.speak.unsupported')}</p>
          ) : null}
        </div>
      </div>

      <section className="chat__suggestions" aria-labelledby="suggestions-title">
        <h2 id="suggestions-title" className="chat__suggestions-title">
          {t('chat.suggestions.title')}
        </h2>
        <ul className="chat__chips">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className="chat__chip"
                onClick={() => send(suggestion)}
                disabled={busy}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="chat__disclaimer">{t('disclaimer.full')}</p>
    </div>
  );
}
