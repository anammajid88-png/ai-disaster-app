/**
 * Disaster detection regression tests.
 *
 *   node scripts/test-detection.mjs
 *
 * detectDisaster() decides which safety guidance an offline user receives, so a
 * wrong category here is a wrong first-aid answer. Every case below is a real
 * phrasing that was once mis-routed, kept as a guard:
 *
 *  - English continuous phrasing ("water is entering my house") scored zero
 *    because the keyword list only had the past tense.
 *  - Short Urdu and Hindi stems matched inside unrelated words, so a bleeding
 *    question was answered with earthquake guidance.
 *  - The Devanagari nukta spelling "ख़ून" missed the plain "खून" keyword.
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { detectDisaster } = require(join(ROOT, 'server', 'utils', 'disaster.js'));

let failures = 0;

/** @param {string|null} expected disaster id, or null for "no clear category" */
function expectType(message, expected) {
  const { disasterType } = detectDisaster(message);
  const pass = disasterType === expected;
  if (!pass) failures += 1;
  console.log(
    `  ${pass ? 'PASS' : 'FAIL'}  ${String(disasterType).padEnd(18)} ${message}` +
      (pass ? '' : `   (expected ${expected})`)
  );
}

function expectUrgency(message, expected) {
  const { urgency } = detectDisaster(message);
  const pass = urgency === expected;
  if (!pass) failures += 1;
  console.log(
    `  ${pass ? 'PASS' : 'FAIL'}  ${urgency.padEnd(18)} ${message}` +
      (pass ? '' : `   (expected ${expected})`)
  );
}

console.log('\nEnglish phrasing');
expectType('water is entering my house', 'flood');
expectType('water is rising in our street', 'flood');
expectType('there is knee deep water outside', 'flood');
expectType('someone is drowning', 'flood');
expectType('my kitchen is on fire', 'fire');
expectType('there is smoke coming from the wires', 'fire');
expectType('the building is shaking', 'earthquake');
expectType('very heavy rain and strong wind', 'storm');
expectType('a car hit a motorcycle on the road', 'road-accident');
expectType('someone is bleeding badly', 'medical-emergency');

console.log('\nRoman Urdu');
expectType('sailab aa gaya hai', 'flood');
expectType('ghar mein aag lag gayi', 'fire');
expectType('zalzala aaya hai', 'earthquake');
expectType('toofan aa raha hai', 'storm');
expectType('accident ho gaya hai', 'road-accident');
expectType('behosh ho gaya hai', 'medical-emergency');

console.log('\nUrdu script');
expectType('گھر میں سیلاب کا پانی آ گیا ہے', 'flood');
expectType('آگ لگ گئی ہے', 'fire');
expectType('عمارت ہل رہی ہے', 'earthquake');
expectType('کسی کا خون زیادہ بہہ رہا ہے، پہلے کیا کروں؟', 'medical-emergency');

console.log('\nHindi script');
expectType('घर में बाढ़ का पानी आ गया है', 'flood');
expectType('जलभराव हो गया है', 'flood');
expectType('घर में आग लग गई है', 'fire');
expectType('भूकंप आया है', 'earthquake');
// Nukta spelling of "blood" - a different codepoint sequence to "खून".
expectType('किसी का ख़ून बहुत बह रहा है, पहले क्या करें?', 'medical-emergency');

console.log('\nShort stems must not match inside unrelated words');
// "پہلے" (first) contains "ہل" (shake); "آگے" (ahead) contains "آگ" (fire);
// "جلدی" (quickly) contains "جل" (burn).
expectType('آگے کیا کرنا چاہیے', null);
expectType('پہلے کیا کروں', null);
expectType('جلدی بتائیں', null);

console.log('\nUrgency');
expectUrgency('water is entering my house', 'high');
expectUrgency('my father is not breathing', 'high');
// A calm sentence about a life-threatening symptom is still urgent.
expectUrgency('someone collapsed and is not breathing', 'high');
expectUrgency('what should I keep in an emergency kit', 'high'); // "emergency" is a marker
expectUrgency('how many litres of water per person', 'normal');

console.log('\nNo message');
expectType('', null);
expectType('   ', null);

console.log(failures === 0 ? '\nAll detection cases passed\n' : `\n${failures} case(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
