import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Text-to-speech for the "Listen" button.
 *
 * Urdu and Hindi voices are not installed on every device, so the requested
 * locale is matched against the available voices with the language's own
 * fallback chain before giving up.
 */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

function pickVoice(voices, locale, fallbacks) {
  const wanted = [locale, ...fallbacks];

  for (const tag of wanted) {
    const exact = voices.find((voice) => voice.lang?.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
  }
  for (const tag of wanted) {
    const base = tag.split('-')[0].toLowerCase();
    const partial = voices.find((voice) => voice.lang?.toLowerCase().startsWith(base));
    if (partial) return partial;
  }
  return null;
}

export function useSpeechSynthesis({ locale = 'en-PK', fallbacks = [] } = {}) {
  const supported = Boolean(synth);
  const [speaking, setSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!supported) return undefined;

    const load = () => setVoices(synth.getVoices());
    load();
    // Chrome populates the list asynchronously.
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    synth.cancel();
    setSpeaking(false);
    setSpeakingId(null);
  }, [supported]);

  /**
   * @param {string} text
   * @param {string} [id] message id, so the UI can show which bubble is playing
   */
  const speak = useCallback(
    (text, id = null) => {
      if (!supported || !text?.trim()) return;

      // Speaking twice at once is unusable, so always reset first.
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(voices, locale, fallbacks);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || locale;
      // Slightly slower than default: this is safety information.
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onend = () => {
        setSpeaking(false);
        setSpeakingId(null);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setSpeakingId(null);
      };

      utteranceRef.current = utterance;
      setSpeaking(true);
      setSpeakingId(id);
      synth.speak(utterance);
    },
    [supported, voices, locale, fallbacks]
  );

  // Stop talking when the screen unmounts.
  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, speakingId, speak, stop };
}
