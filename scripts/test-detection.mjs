/**
 * Disaster detection and language detection regression tests.
 *
 *   node scripts/test-detection.mjs
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { detectDisaster } = require(join(ROOT, 'server', 'utils', 'disaster.js'));
const { detectLanguage } = require(join(ROOT, 'server', 'utils', 'language.js'));

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

function expectLanguage(message, expectedLang) {
  const { language } = detectLanguage(message);
  const pass = language === expectedLang;
  if (!pass) failures += 1;
  console.log(
    `  ${pass ? 'PASS' : 'FAIL'}  ${language.padEnd(10)} (expected ${expectedLang}) ${message.slice(0, 45)}`
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
expectType('किसी का ख़ून बहुत बह रहा है, पहले क्या करें?', 'medical-emergency');

console.log('\nChinese phrasing');
expectType('洪水正在进入我的房屋', 'flood');
expectType('厨房着火起火了', 'fire');
expectType('发生了强烈地震房屋倒塌', 'earthquake');
expectType('暴风雨非常大有雷电', 'storm');
expectType('发生了严重车祸相撞', 'road-accident');
expectType('伤员严重流血休克', 'medical-emergency');

console.log('\nFrench phrasing');
expectType('inondation dans la maison', 'flood');
expectType('incendie dans la cuisine avec des flammes', 'fire');
expectType('seisme et tremblement de terre', 'earthquake');
expectType('forte tempete et cyclone', 'storm');
expectType('accident de la route avec collision', 'road-accident');
expectType('personne avec forte hemorragie', 'medical-emergency');

console.log('\nGerman phrasing');
expectType('hochwasser und flut im haus', 'flood');
expectType('grosser brand und feuer in der wohnung', 'fire');
expectType('starkes erdbeben erschuetterung', 'earthquake');
expectType('schwerer sturm und unwetter', 'storm');
expectType('schwerer verkehrsunfall auf der strasse', 'road-accident');
expectType('starke blutung und verletzung', 'medical-emergency');

console.log('\nShort stems must not match inside unrelated words');
expectType('آگے کیا کرنا چاہیے', null);
expectType('پہلے کیا کروں', null);
expectType('جلدی بتائیں', null);

console.log('\nUrgency');
expectUrgency('water is entering my house', 'high');
expectUrgency('my father is not breathing', 'high');
expectUrgency('someone collapsed and is not breathing', 'high');
expectUrgency('what should I keep in an emergency kit', 'high');
expectUrgency('how many litres of water per person', 'normal');
expectUrgency('救命！有人停止呼吸了', 'high');
expectUrgency('aidez-moi il y a urgence', 'high');
expectUrgency('hilfe sofort rettung', 'high');

console.log('\nLanguage Detection across six languages');
expectLanguage('Hello, what should I do during an earthquake?', 'en');
expectLanguage('سیلاب میں کیا کرنا چاہیے؟', 'ur');
expectLanguage('भूकंप आने पर क्या करना चाहिए?', 'hi');
expectLanguage('发生地震时我应该怎么做？', 'zh-CN');
expectLanguage('Que faire en cas d inondation dans la maison avec les secours?', 'fr');
expectLanguage('Was tun bei einem Erdbeben im Haus mit Hilfe der Rettung?', 'de');
expectLanguage('pani ghar mein bhar gaya hai kya karu', 'ur');

console.log('\nNo message');
expectType('', null);
expectType('   ', null);

console.log(failures === 0 ? '\nAll detection cases passed\n' : `\n${failures} case(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
