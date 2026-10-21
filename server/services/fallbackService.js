'use strict';

const { disastersById, contactsById, emergencyContacts } = require('../../shared/data/index.cjs');

/**
 * Offline / API-unavailable fallback answers.
 *
 * Built from the exact same JSON the user reads on the Guidelines screens, so
 * fallback advice can never contradict the app's own content. Answers are
 * always labelled `source: "fallback"` by aiService so the UI can say clearly
 * that this is stored emergency guidance and not an AI answer.
 */

const HEADINGS = {
  en: { rightNow: 'Do this right now', during: 'During', call: 'Call' },
  ur: { rightNow: 'ابھی یہ کریں', during: 'دوران', call: 'کال کریں' },
  hi: { rightNow: 'अभी यह करें', during: 'दौरान', call: 'कॉल करें' },
  'zh-CN': { rightNow: '立即执行', during: '应对期间', call: '呼叫' },
  fr: { rightNow: 'À faire immédiatement', during: 'Pendant', call: 'Appeler' },
  de: { rightNow: 'Sofortmaßnahmen', during: 'Währenddessen', call: 'Anrufen' },
};

const NO_MATCH = {
  en: [
    'Tell me what is happening in one line, for example "water is entering my house" or "there is a fire in the kitchen", and I will give you the immediate steps.',
    'If someone is in danger right now, call Rescue 1122 or Police 15 first.',
  ].join('\n'),
  ur: [
    'ایک جملے میں بتائیں کیا ہو رہا ہے، مثلاً "گھر میں پانی آ رہا ہے" یا "باورچی خانے میں آگ لگ گئی ہے"، میں فوری اقدامات بتاؤں گا۔',
    'اگر ابھی کسی کی جان خطرے میں ہے تو پہلے ریسکیو 1122 یا پولیس 15 کو کال کریں۔',
  ].join('\n'),
  hi: [
    'एक पंक्ति में बताएँ क्या हो रहा है, जैसे "घर में पानी आ रहा है" या "रसोई में आग लग गई है", मैं तुरंत उठाए जाने वाले क़दम बताऊँगा।',
    'अगर अभी किसी की जान ख़तरे में है तो पहले रेस्क्यू 1122 या पुलिस 15 पर कॉल करें।',
  ].join('\n'),
  'zh-CN': [
    '请用一句话告诉我发生了什么，例如“洪水正在进入我的房屋”或“厨房起火了”，我将为您提供即刻应对步骤。',
    '如果有人正面临生命危险，请立即优先拨打 救援电话 1122 或 报警电话 15。',
  ].join('\n'),
  fr: [
    'Décrivez ce qui se passe en une phrase, par exemple "l\'eau entre dans ma maison" ou "il y a un incendie dans la cuisine", et je vous donnerai les mesures immédiates.',
    'Si quelqu\'un est en danger immédiat, appelez d\'abord les secours 1122 ou la police 15.',
  ].join('\n'),
  de: [
    'Beschreiben Sie in einem Satz, was passiert, z. B. "Wasser dringt in mein Haus ein" oder "In der Küche brennt es", und ich gebe Ihnen die Sofortmaßnahmen.',
    'Wenn jemand in akuter Lebensgefahr schwebt, rufen Sie zuerst Rettung 1122 oder Polizei 15.',
  ].join('\n'),
};

const pickLanguage = (language) => (HEADINGS[language] ? language : 'en');

function contactLine(disasterId, language) {
  const ids = emergencyContacts.disasterContactMap[disasterId] || ['rescue-1122'];
  const labels = ids
    .map((id) => contactsById[id])
    .filter(Boolean)
    .map((contact) => `${contact.name[language] || contact.name.en} ${contact.number}`);

  return `${HEADINGS[language].call}: ${labels.join(' / ')}`;
}

/**
 * @param {string|null} disasterType
 * @param {string} language
 * @param {'high'|'normal'} urgency
 * @returns {{text:string, disasterType:string|null, matched:boolean}}
 */
function buildFallbackAnswer(disasterType, language, urgency = 'normal') {
  const lang = pickLanguage(language);
  const disaster = disasterType ? disastersById[disasterType] : null;

  if (!disaster) {
    return { text: NO_MATCH[lang], disasterType: null, matched: false };
  }

  const content = disaster.content[lang] || disaster.content.en;
  const headings = HEADINGS[lang];

  // In a live emergency the immediate actions matter; otherwise add the
  // "during" steps so the answer is still genuinely useful.
  const steps = urgency === 'high' ? content.rightNow : [...content.rightNow, ...content.during.slice(0, 3)];

  const lines = [
    `${content.name} - ${headings.rightNow}:`,
    ...steps.map((item, index) => `${index + 1}. ${item.title}. ${item.text}`),
    contactLine(disaster.id, lang),
  ];

  return { text: lines.join('\n'), disasterType: disaster.id, matched: true };
}

module.exports = { buildFallbackAnswer };
