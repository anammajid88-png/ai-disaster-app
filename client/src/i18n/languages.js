/**
 * Language registry - the single place to add a language.
 *
 * Adding Punjabi, Sindhi, Pashto or Balochi later means:
 *   1. add a complete locale JSON in ./locales
 *   2. add the language content block to each file in shared/data/disasters
 *   3. add one entry here
 *   4. add the code to SUPPORTED in server/utils/language.js
 *
 * Nothing in the UI needs to change. Incomplete translations are deliberately
 * not shipped - a half-translated emergency screen is a safety risk.
 */

export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr',
    htmlLang: 'en',
    // BCP-47 tag used by SpeechRecognition and SpeechSynthesis.
    speechLocale: 'en-PK',
    speechFallbacks: ['en-IN', 'en-GB', 'en-US'],
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
];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_CODES = LANGUAGES.map((language) => language.code);

export const getLanguage = (code) =>
  LANGUAGES.find((language) => language.code === code) ||
  LANGUAGES.find((language) => language.code === DEFAULT_LANGUAGE);

export const isSupported = (code) => LANGUAGE_CODES.includes(code);
