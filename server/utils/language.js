'use strict';

/**
 * Language detection for the disaster assistant.
 *
 * Returns both a language code and the script the user actually typed in,
 * so the AI can reply in Roman Urdu when the user typed Roman Urdu instead of
 * forcing them to read Urdu script they may not be comfortable with.
 *
 * Adding a language later means adding one entry to LANGUAGES and (optionally)
 * a Roman marker list - no other file needs to change.
 */

const SUPPORTED = ['en', 'ur', 'hi'];
const DEFAULT_LANGUAGE = 'en';

const LANGUAGE_NAMES = {
  en: 'English',
  ur: 'Urdu',
  hi: 'Hindi',
};

// Unicode ranges that identify a script unambiguously.
const SCRIPT_RANGES = [
  { language: 'ur', script: 'arabic', regex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g },
  { language: 'hi', script: 'devanagari', regex: /[\u0900-\u097F]/g },
];

// Roman Urdu / Roman Hindi markers. Roman Urdu and Roman Hindi are largely
// identical in writing, so Roman input is treated as Urdu (Pakistan-focused
// product) unless a Hindi-only marker appears.
const ROMAN_URDU_MARKERS = [
  'mere', 'mera', 'meri', 'mujhe', 'mujhy', 'hamare', 'hamara', 'ghar', 'ghr',
  'pani', 'paani', 'bhar', 'bharr', 'gaya', 'gya', 'gai', 'gayi', 'hai', 'hy',
  'kya', 'kia', 'karu', 'karun', 'karoon', 'karna', 'chahiye', 'chahye',
  'kaise', 'kesay', 'kahan', 'kahaan', 'madad', 'madat', 'aag', 'jal', 'jalna',
  'zalzala', 'zameen', 'hil', 'bijli', 'barish', 'toofan', 'sailab', 'seelab',
  'chot', 'zakhmi', 'saans', 'dard', 'bemar', 'bimar', 'bacha', 'bache',
  'nikal', 'bahir', 'bahar', 'andar', 'jaldi', 'khatra', 'khatarnak',
  'ambulance', 'hospital', 'nahi', 'nahin', 'phans', 'gir', 'tootna', 'raha',
  'rahi', 'kar', 'hua', 'hui', 'ho', 'hum', 'main', 'mein', 'mai',
];

// Devanagari-speakers writing Roman sometimes use these Hindi-leaning spellings.
const ROMAN_HINDI_MARKERS = [
  'baadh', 'badh', 'aag', 'bhukamp', 'bhookamp', 'kripya', 'kripya', 'karein',
  'kariye', 'chaahiye', 'ghar', 'jaldi', 'madad', 'bijli', 'baarish', 'toofaan',
];

// Markers unique enough to Hindi Roman that they outweigh the Urdu default.
const ROMAN_HINDI_ONLY = ['bhukamp', 'bhookamp', 'baadh', 'kripya', 'kripya', 'karein', 'kariye'];

const WORD_SPLIT = /[^a-z0-9\u0600-\u06FF\u0900-\u097F]+/i;

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(WORD_SPLIT)
    .filter(Boolean);
}

function countMatches(text, regex) {
  const matches = String(text).match(regex);
  return matches ? matches.length : 0;
}

/**
 * @param {string} text raw user message
 * @param {string} [preferred] language currently selected in the UI
 * @returns {{language:string, script:string, confidence:number, source:string}}
 */
function detectLanguage(text, preferred) {
  const raw = String(text || '').trim();
  const fallback = SUPPORTED.includes(preferred) ? preferred : DEFAULT_LANGUAGE;

  if (!raw) {
    return { language: fallback, script: fallback === 'en' ? 'latin' : 'native', confidence: 0, source: 'preferred' };
  }

  // 1. Non-Latin scripts are decisive.
  for (const entry of SCRIPT_RANGES) {
    const hits = countMatches(raw, entry.regex);
    if (hits >= 2) {
      return { language: entry.language, script: entry.script, confidence: 0.98, source: 'script' };
    }
  }

  // 2. Latin input: score Roman Urdu / Roman Hindi markers.
  const tokens = tokenize(raw);
  if (tokens.length === 0) {
    return { language: fallback, script: 'latin', confidence: 0, source: 'preferred' };
  }

  const urduHits = tokens.filter((t) => ROMAN_URDU_MARKERS.includes(t)).length;
  const hindiHits = tokens.filter((t) => ROMAN_HINDI_MARKERS.includes(t)).length;
  const hindiOnlyHits = tokens.filter((t) => ROMAN_HINDI_ONLY.includes(t)).length;
  const ratio = Math.max(urduHits, hindiHits) / tokens.length;

  const looksSouthAsian = ratio >= 0.25 || urduHits >= 2 || hindiOnlyHits >= 1;

  if (looksSouthAsian) {
    const language = hindiOnlyHits > 0 && hindiHits >= urduHits ? 'hi' : 'ur';
    return {
      language,
      script: 'latin',
      confidence: Math.min(0.9, 0.5 + ratio),
      source: 'roman-markers',
    };
  }

  // 3. Mostly plain Latin text with no markers -> English, unless the user
  //    explicitly picked another UI language and typed only a couple of words.
  if (tokens.length <= 2 && fallback !== 'en') {
    return { language: fallback, script: 'latin', confidence: 0.4, source: 'preferred' };
  }

  return { language: 'en', script: 'latin', confidence: 0.75, source: 'latin-default' };
}

module.exports = {
  SUPPORTED,
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  detectLanguage,
  tokenize,
};
