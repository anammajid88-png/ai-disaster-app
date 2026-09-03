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
   *
   * Missing keys fall back to English, then to the key itself, so a screen can
   * never render blank because of a translation gap.
   */
  const t = useCallback(
    (path, values) => {
      const raw = lookup(DICTIONARIES[language.code], path) ?? lookup(DICTIONARIES.en, path);

      if (raw == null) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${path}`);
        return path;
      }
      if (typeof raw === 'string') return interpolate(raw, values);
      return raw;
    },
    [language.code]
  );

  /**
   * Picks the correct block out of the shared safety JSON, which is keyed by
   * language code, with an English safety net.
   */
  const localize = useCallback(
    (multilingual) => {
      if (!multilingual) return '';
      return multilingual[language.code] ?? multilingual.en ?? '';
    },
    [language.code]
  );

  const value = useMemo(
    () => ({
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
  if (!context) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return context;
}
