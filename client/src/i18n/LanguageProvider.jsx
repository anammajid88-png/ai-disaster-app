import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import ur from './locales/ur.json';
import hi from './locales/hi.json';
import { DEFAULT_LANGUAGE, getLanguage, isSupported, LANGUAGES } from './languages';

const DICTIONARIES = { en, ur, hi };

const STORAGE_KEY = 'ai-disaster-app:language';

const LanguageContext = createContext(null);

/** Reads a dotted key path out of a nested dictionary. */
function lookup(dictionary, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), dictionary);
}

/** Replaces {name} placeholders. */
function interpolate(text, values) {
  if (!values) return text;
  return Object.keys(values).reduce(
    (result, key) => result.replaceAll(`{${key}}`, String(values[key])),
    text
  );
}

function readStoredLanguage() {
  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang && isSupported(urlLang)) return urlLang;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupported(stored)) return stored;
  } catch {
    // Private mode / storage disabled - fall through to browser preference.
  }

  const browserLanguages = navigator.languages || [navigator.language || ''];
  for (const tag of browserLanguages) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (isSupported(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [code, setCode] = useState(readStoredLanguage);

  const language = getLanguage(code);

  // Keep the document in sync so RTL, hyphenation and screen readers behave.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language.htmlLang;
    root.dir = language.dir;
    root.dataset.lang = language.code;

    try {
      localStorage.setItem(STORAGE_KEY, language.code);
    } catch {
      // Preference simply will not persist; the app still works.
    }
  }, [language]);

  const setLanguage = useCallback((next) => {
    setCode(isSupported(next) ? next : DEFAULT_LANGUAGE);
  }, []);

  /**
   * t('chat.title')                     -> string
   * t('kit.progress', { done: 3, ... }) -> interpolated string
   * t('about.who.items')                -> array (returned as-is)
   */
  const t = useCallback(
    (path, values) => {
      const activeDict = DICTIONARIES[code];
      const fallbackDict = DICTIONARIES[DEFAULT_LANGUAGE];

      let entry = lookup(activeDict, path);
      if (entry === undefined && activeDict !== fallbackDict) {
        entry = lookup(fallbackDict, path);
      }

      if (entry === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] missing key: "${path}" in lang "${code}"`);
        }
        return path;
      }

      if (typeof entry === 'string') {
        return interpolate(entry, values);
      }

      return entry;
    },
    [code]
  );

  /**
   * Translates content objects that store { en, ur, hi } directly, e.g. disaster
   * descriptions in shared/data.
   */
  const localize = useCallback(
    (field) => {
      if (!field || typeof field !== 'object') return '';
      return field[code] || field[DEFAULT_LANGUAGE] || '';
    },
    [code]
  );

  const value = useMemo(
    () => ({
      code: language.code,
      language: language.code,
      languageMeta: language,
      languages: LANGUAGES,
      dir: language.dir,
      isRtl: language.dir === 'rtl',
      setLanguage,
      t,
      localize,
    }),
    [language, setLanguage, t, localize]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
