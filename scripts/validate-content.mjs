/**
 * Content and translation validator.
 *
 *   node scripts/validate-content.mjs
 *
 * Catches the failure modes that only show up as broken text on screen:
 *  - a t('...') key used in the UI that no locale defines
 *  - a key present in English but missing from Urdu, Hindi, Chinese, French, German (or the reverse)
 *  - a dynamic key built from data (season, risk level, tabs) with no entry
 *  - an icon name in the safety data that no icon component draws
 *  - safety content missing a language or a required section
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'client', 'src');
const LOCALES = join(SRC, 'i18n', 'locales');
const LANGUAGES = ['en', 'ur', 'hi', 'zh-CN', 'fr', 'de'];
const SECTIONS = ['rightNow', 'before', 'during', 'after', 'avoid'];

let problems = 0;

function fail(message) {
  problems += 1;
  console.log(`  FAIL  ${message}`);
}

function ok(message) {
  console.log(`  PASS  ${message}`);
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** Every file under a directory, recursively, matching the given extensions. */
function walk(dir, extensions) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

/** Flattens a locale object into dot-paths, keeping arrays as single leaves. */
function flatten(value, prefix = '', out = new Set()) {
  if (Array.isArray(value) || typeof value !== 'object' || value === null) {
    out.add(prefix);
    return out;
  }

  for (const [key, child] of Object.entries(value)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, out);
  }

  return out;
}

/* ------------------------------------------------------------- Load data */

const locales = Object.fromEntries(
  LANGUAGES.map((lang) => [lang, readJson(join(LOCALES, `${lang}.json`))])
);
const keySets = Object.fromEntries(
  LANGUAGES.map((lang) => [lang, flatten(locales[lang])])
);

const sourceFiles = walk(SRC, ['.jsx', '.js']);
const sources = new Map(sourceFiles.map((file) => [file, readFileSync(file, 'utf8')]));

const disastersDir = join(ROOT, 'shared', 'data', 'disasters');
const disasters = readdirSync(disastersDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => readJson(join(disastersDir, name)));
const emergencyContacts = readJson(join(ROOT, 'shared', 'data', 'emergencyContacts.json'));
const emergencyKit = readJson(join(ROOT, 'shared', 'data', 'emergencyKit.json'));

const iconNames = new Set();
for (const component of ['SafetyIcon.jsx', 'UiIcon.jsx']) {
  const text = readFileSync(join(SRC, 'components', component), 'utf8');
  for (const match of text.matchAll(/^ {2}'?([a-zA-Z-]+)'?: \(/gm)) {
    iconNames.add(match[1]);
  }
}

/* ------------------------------------------------------- Locale key parity */

console.log('\nLocale parity');
for (const lang of LANGUAGES.slice(1)) {
  const missing = [...keySets.en].filter((key) => !keySets[lang].has(key));
  const extra = [...keySets[lang]].filter((key) => !keySets.en.has(key));

  if (missing.length) fail(`${lang}.json is missing ${missing.length} key(s): ${missing.slice(0, 8).join(', ')}`);
  else ok(`${lang}.json defines every English key`);

  if (extra.length) fail(`${lang}.json has ${extra.length} key(s) not in en.json: ${extra.slice(0, 8).join(', ')}`);
  else ok(`${lang}.json has no orphan keys`);
}

/* -------------------------------------------------- Static keys used in UI */

console.log('\nTranslation keys used in the UI');
{
  const used = new Map();

  for (const [file, text] of sources) {
    for (const match of text.matchAll(/\bt\(\s*'([^']+)'/g)) {
      if (!used.has(match[1])) used.set(match[1], file);
    }
  }

  const unknown = [...used].filter(([key]) => !keySets.en.has(key));

  if (unknown.length) {
    for (const [key, file] of unknown) {
      fail(`t('${key}') has no entry in en.json (${file.replace(ROOT, '.')})`);
    }
  } else {
    ok(`all ${used.size} literal t() keys resolve`);
  }
}

/* ------------------------------------------------ Dynamic, data-built keys */

console.log('\nKeys built from data at runtime');
{
  const required = new Set();

  for (const disaster of disasters) {
    required.add(`disaster.season.${disaster.season}`);
    required.add(`disaster.risk.${disaster.riskLevel}`);

    for (const language of LANGUAGES) {
      for (const section of SECTIONS) {
        for (const step of disaster.content[language]?.[section] || []) {
          if (step.priority) required.add(`guidelines.priority.${step.priority}`);
        }
      }
    }
  }

  for (const key of ['before', 'during', 'after', 'avoid', 'rightNow']) required.add(`guidelines.${key}`);
  for (const key of ['contacts', 'kit', 'location']) required.add(`emergency.tabs.${key}`);
  // The exact codes useGeolocation and useSpeechRecognition can put on screen.
  for (const key of ['unsupported', 'denied', 'unavailable', 'timeout']) required.add(`location.${key}`);
  for (const key of ['unsupported', 'denied', 'error']) required.add(`chat.mic.${key}`);

  const missing = [...required].filter((key) => !keySets.en.has(key));

  if (missing.length) missing.forEach((key) => fail(`data needs t('${key}') but no locale defines it`));
  else ok(`all ${required.size} data-driven keys resolve`);
}

/* ------------------------------------------------------------ Safety data */

console.log('\nSafety data');
{
  ok(`${disasters.length} disaster categories found`);
  if (disasters.length !== 6) fail(`expected 6 disaster categories, found ${disasters.length}`);

  for (const disaster of disasters) {
    for (const language of LANGUAGES) {
      const content = disaster.content[language];

      if (!content) {
        fail(`${disaster.id} has no ${language} content`);
        continue;
      }

      for (const field of ['name', 'tagline', 'description']) {
        if (!content[field]?.trim()) fail(`${disaster.id}.${language} is missing ${field}`);
      }

      for (const section of SECTIONS) {
        if (!Array.isArray(content[section]) || content[section].length === 0) {
          fail(`${disaster.id}.${language} has no ${section} steps`);
        }
      }
    }

    // Step counts must match across languages or a user would see fewer steps.
    for (const section of SECTIONS) {
      const counts = LANGUAGES.map((lang) => disaster.content[lang]?.[section]?.length ?? -1);
      if (new Set(counts).size !== 1) {
        fail(`${disaster.id}.${section} step counts differ across languages: ${counts.join('/')}`);
      }
    }

    for (const id of disaster.primaryContacts) {
      if (!emergencyContacts.contacts.some((contact) => contact.id === id)) {
        fail(`${disaster.id} references unknown contact "${id}"`);
      }
    }
  }

  ok('disaster content checked in all six languages');
}

/* ------------------------------------------------------------------ Icons */

console.log('\nIcons referenced by data');
{
  const referenced = new Set();

  for (const disaster of disasters) {
    for (const language of LANGUAGES) {
      for (const section of SECTIONS) {
        for (const step of disaster.content[language]?.[section] || []) {
          if (step.icon) referenced.add(step.icon);
        }
      }
    }
  }

  for (const contact of emergencyContacts.contacts) referenced.add(contact.icon);
  for (const item of emergencyKit.items) referenced.add(item.icon);

  const missing = [...referenced].filter((name) => !iconNames.has(name));

  if (missing.length) missing.forEach((name) => fail(`icon "${name}" is used by data but not drawn by any icon component`));
  else ok(`all ${referenced.size} data icons exist`);
}

/* --------------------------------------------------------- Emergency data */

console.log('\nEmergency contacts and kit');
{
  const allowed = new Set(['1122', '15', '16', '115', '130', '1023']);

  for (const contact of emergencyContacts.contacts) {
    if (!allowed.has(contact.number)) fail(`contact ${contact.id} uses an unverified number ${contact.number}`);
    if (!contact.source?.organisation || !contact.source?.verifiedOn) fail(`contact ${contact.id} has no source metadata`);

    for (const field of ['name', 'type', 'useWhen', 'coverage']) {
      for (const language of LANGUAGES) {
        if (!contact[field]?.[language]?.trim()) fail(`contact ${contact.id}.${field} missing ${language}`);
      }
    }
  }

  for (const language of LANGUAGES) {
    if (!emergencyContacts.meta?.warning?.[language]) fail(`contacts meta.warning missing ${language}`);
    if (!emergencyKit.meta?.recommendedFor?.[language]) fail(`kit meta.recommendedFor missing ${language}`);
  }

  if (emergencyKit.items.length !== 10) fail(`expected 10 kit items, found ${emergencyKit.items.length}`);

  for (const item of emergencyKit.items) {
    for (const field of ['label', 'detail']) {
      for (const language of LANGUAGES) {
        if (!item[field]?.[language]?.trim()) fail(`kit item ${item.id}.${field} missing ${language}`);
      }
    }
  }

  ok('contacts and kit checked in all six languages');
}

console.log(problems === 0 ? '\nNo content problems found\n' : `\n${problems} problem(s) found\n`);
process.exit(problems === 0 ? 0 : 1);
