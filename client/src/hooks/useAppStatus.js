import { useEffect, useState } from 'react';
import { getHealth } from '../services/api';

/** Live online/offline flag for the offline banner and AI availability. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

/**
 * Asks the backend whether the AI provider is actually configured, so the UI
 * can show an honest badge instead of implying Qwen is working when it is not.
 * A failure is not an error state: the app simply reports stored guidance mode.
 */
export function useAiStatus(online) {
  const [status, setStatus] = useState({ loading: true, configured: false, model: null });

  useEffect(() => {
    if (!online) {
      setStatus({ loading: false, configured: false, model: null });
      return undefined;
    }

    let active = true;
    getHealth()
      .then((payload) => {
        if (!active) return;
        setStatus({
          loading: false,
          configured: Boolean(payload?.ai?.configured),
          model: payload?.ai?.model || null,
        });
      })
      .catch(() => {
        if (active) setStatus({ loading: false, configured: false, model: null });
      });

    return () => {
      active = false;
    };
  }, [online]);

  return status;
}
