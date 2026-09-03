import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Speech-to-text through the Web Speech API.
 *
 * Voice is an enhancement: when the API is missing (Firefox, some in-app
 * browsers) or permission is denied, `supported`/`error` let the chat show a
 * short message while typing keeps working exactly as before.
 */

const SpeechRecognitionApi =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

export function useSpeechRecognition({ locale = 'en-PK', onResult } = {}) {
  const supported = Boolean(SpeechRecognitionApi);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    }
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;

    setError(null);
    setInterim('');

    const recognition = new SpeechRecognitionApi();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }

      setInterim(interimText);
      if (finalText.trim()) {
        setInterim('');
        onResultRef.current?.(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      // "aborted" happens on a normal manual stop and is not worth reporting.
      if (event.error === 'aborted') return;
      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'denied'
          : 'error'
      );
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setError('error');
      setListening(false);
    }
  }, [supported, listening, locale]);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  // Never leave the microphone open when the user navigates away.
  useEffect(() => () => stop(), [stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}
