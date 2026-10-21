/**
 * Language registry - the single place to add a language.
 *
 * Supported languages:
 *   - en: English
 *   - ur: Urdu (اردو)
 *   - hi: Hindi (हिन्दी)
 *   - zh-CN: Simplified Chinese (简体中文)
 *   - fr: French (Français)
 *   - de: German (Deutsch)
 */

export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr',
    htmlLang: 'en',
    speechLocale: 'en-PK',
    speechFallbacks: ['en-GB', 'en-US', 'en-IN'],
  },
  {
    code: 'ur',
    label: 'Urdu',
    nativeLabel: 'اردو',
    dir: 'rtl',
    htmlLang: 'ur',
    speechLocale: 'ur-PK',
    speechFallbacks: ['ur-IN', 'hi-IN'],
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    dir: 'ltr',
    htmlLang: 'hi',
    speechLocale: 'hi-IN',
    speechFallbacks: ['hi', 'en-IN'],
  },
  {
    code: 'zh-CN',
    label: 'Chinese (Simplified)',
    nativeLabel: '简体中文',
    dir: 'ltr',
    htmlLang: 'zh-CN',
    speechLocale: 'zh-CN',
    speechFallbacks: ['zh-SG', 'zh-HK', 'zh-TW', 'zh'],
  },
  {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    dir: 'ltr',
    htmlLang: 'fr',
    speechLocale: 'fr-FR',
    speechFallbacks: ['fr-CA', 'fr-BE', 'fr-CH', 'fr'],
  },
  {
    code: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    dir: 'ltr',
    htmlLang: 'de',
    speechLocale: 'de-DE',
    speechFallbacks: ['de-AT', 'de-CH', 'de'],
  },
];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_CODES = LANGUAGES.map((language) => language.code);

export const getLanguage = (code) =>
  LANGUAGES.find((language) => language.code === code) ||
  LANGUAGES.find((language) => language.code === DEFAULT_LANGUAGE);

export const isSupported = (code) => {
  if (!code) return false;
  const match = LANGUAGE_CODES.find(
    (c) => c.toLowerCase() === String(code).toLowerCase()
  );
  return Boolean(match);
};
