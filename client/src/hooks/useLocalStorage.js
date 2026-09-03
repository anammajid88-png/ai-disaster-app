import { useCallback, useEffect, useState } from 'react';

/**
 * State that survives a reload, used for the emergency kit checklist.
 * Storage failures (private mode, quota) never break the UI - the value simply
 * stays in memory for the session.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore: preference is not persisted, everything else still works.
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return [value, setValue, reset];
}
