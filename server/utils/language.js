'use strict';

/**
 * Language detection for the disaster assistant.
 * Supports six languages: English (en), Urdu (ur), Hindi (hi),
 * Chinese (zh-CN), French (fr), German (de).
 */

const SUPPORTED = ['en', 'ur', 'hi', 'zh-CN', 'fr', 'de'];
const DEFAULT_LANGUAGE = 'en';

const LANGUAGE_NAMES = {
  en: 'English',
  ur: 'Urdu',
  hi: 'Hindi',
  'zh-CN': 'Chinese (Simplified)',
  fr: 'French',
  de: 'German',
};

// Unicode ranges that identify a script unambiguously.
const SCRIPT_RANGES = [
  { language: 'ur', script: 'arabic', regex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g },
  { language: 'hi', script: 'devanagari', regex: /[\u0900-\u097F]/g },
  { language: 'zh-CN', script: 'han', regex: /[\u4E00-\u9FFF\u3400-\u4DBF]/g },
];

// Roman Urdu / Roman Hindi markers.
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

const ROMAN_HINDI_MARKERS = [
  'baadh', 'badh', 'aag', 'bhukamp', 'bhookamp', 'kripya', 'karein',
  'kariye', 'chaahiye', 'ghar', 'jaldi', 'madad', 'bijli', 'baarish', 'toofaan',
];

const ROMAN_HINDI_ONLY = ['bhukamp', 'bhookamp', 'baadh', 'kripya', 'karein', 'kariye'];

const FRENCH_MARKERS = [
  'le', 'la', 'les', 'un', 'une', 'des', 'est', 'dans', 'pour', 'avec', 'aide',
  'inondation', 'seisme', 'tremblement', 'feu', 'incendie', 'tempete',
  'accident', 'urgence', 'sauver', 'blessure', 'hopital', 'comment', 'faire',
  'secours', 'maison', 'danger', 'evacuation', 'eau', 'qui', 'que', 'mon', 'ma', 'mes'
];

const GERMAN_MARKERS = [
  'der', 'die', 'das', 'ein', 'eine', 'und', 'ist', 'in', 'fur', 'mit', 'hilfe',
  'hochwasser', 'erdbeben', 'feuer', 'brand', 'sturm', 'unfall', 'notfall',
  'rettung', 'verletzung', 'krankenhaus', 'wie', 'tun', 'gefahr', 'evakuierung',
  'wasser', 'nicht', 'bitte', 'haus', 'mein', 'meine', 'wir', 'ich'
];

const WORD_SPLIT = /[^a-z0-9\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF\u00C0-\u017F]+/i;

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics for token comparison
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
    return {
      language: fallback,
      script: fallback === 'zh-CN' ? 'han' : fallback === 'ur' ? 'arabic' : fallback === 'hi' ? 'devanagari' : 'latin',
      confidence: 0,
      source: 'preferred',
    };
  }

  // 1. Non-Latin scripts are decisive (Urdu, Hindi, Chinese).
  for (const entry of SCRIPT_RANGES) {
    const hits = countMatches(raw, entry.regex);
    if (hits >= 2 || (entry.language === 'zh-CN' && hits >= 1)) {
      return { language: entry.language, script: entry.script, confidence: 0.98, source: 'script' };
    }
  }

  // 2. Latin input: check tokens for French, German, Roman Urdu, Roman Hindi.
  const tokens = tokenize(raw);
  if (tokens.length === 0) {
    return { language: fallback, script: 'latin', confidence: 0, source: 'preferred' };
  }

  // Score French
  const frenchHits = tokens.filter((t) => FRENCH_MARKERS.includes(t)).length;
  // Score German
  const germanHits = tokens.filter((t) => GERMAN_MARKERS.includes(t)).length;
  // Score South Asian
  const urduHits = tokens.filter((t) => ROMAN_URDU_MARKERS.includes(t)).length;
  const hindiHits = tokens.filter((t) => ROMAN_HINDI_MARKERS.includes(t)).length;
  const hindiOnlyHits = tokens.filter((t) => ROMAN_HINDI_ONLY.includes(t)).length;

  const totalTokens = tokens.length;

  if (frenchHits >= 2 || (frenchHits >= 1 && frenchHits / totalTokens >= 0.25 && frenchHits > germanHits && frenchHits > urduHits)) {
    return { language: 'fr', script: 'latin', confidence: Math.min(0.92, 0.5 + frenchHits / totalTokens), source: 'french-markers' };
  }

  if (germanHits >= 2 || (germanHits >= 1 && germanHits / totalTokens >= 0.25 && germanHits > frenchHits && germanHits > urduHits)) {
    return { language: 'de', script: 'latin', confidence: Math.min(0.92, 0.5 + germanHits / totalTokens), source: 'german-markers' };
  }

  const ratioSA = Math.max(urduHits, hindiHits) / totalTokens;
  const looksSouthAsian = ratioSA >= 0.25 || urduHits >= 2 || hindiOnlyHits >= 1;

  if (looksSouthAsian) {
    const language = hindiOnlyHits > 0 && hindiHits >= urduHits ? 'hi' : 'ur';
    return {
      language,
      script: 'latin',
      confidence: Math.min(0.9, 0.5 + ratioSA),
      source: 'roman-markers',
    };
  }

  // 3. Fallback for preferred UI language when token count is short
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
