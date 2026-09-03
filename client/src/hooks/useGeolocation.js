import { useCallback, useState } from 'react';

/**
 * Approximate location from the browser Geolocation API.
 *
 * It is used for one honest purpose: letting the user read their coordinates
 * out to a rescue operator. Coordinates stay in the browser - they are never
 * sent to our server or to the AI, and nothing is tracked continuously.
 */

const ERROR_KEYS = {
  1: 'denied', // PERMISSION_DENIED
  2: 'unavailable', // POSITION_UNAVAILABLE
  3: 'timeout', // TIMEOUT
};

export function useGeolocation() {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [position, setPosition] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  const request = useCallback(() => {
    if (!supported) {
      setStatus('error');
      setErrorKey('unsupported');
      return;
    }

    setStatus('loading');
    setErrorKey(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        setPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp,
        });
        setStatus('success');
      },
      (error) => {
        setErrorKey(ERROR_KEYS[error.code] || 'unavailable');
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  }, [supported]);

  return { supported, status, position, errorKey, request };
}
