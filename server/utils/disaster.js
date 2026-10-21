'use strict';

/**
 * Disaster intent detection.
 *
 * Used for two things:
 *  1. Telling the client which disaster the question was about (so the UI can
 *     surface the matching guideline card and emergency number).
 *  2. Selecting local fallback guidance when the Qwen API is unreachable.
 *
 * It is a keyword/score matcher on purpose: it must be instant, offline-safe
 * and deterministic. The real language understanding is done by Qwen.
 */

const DISASTER_KEYWORDS = {
  flood: {
    en: ['flood', 'flooding', 'flooded', 'water level', 'water entered', 'water entering', 'water is entering', 'water coming', 'water is coming', 'water rising', 'water is rising', 'water inside', 'water in my house', 'water in the house', 'water in the street', 'knee deep', 'waist deep', 'drown', 'overflow', 'river', 'dam', 'monsoon water', 'waterlogged', 'sewage water'],
    ur: ['سیلاب', 'پانی', 'ڈوب', 'طغیانی', 'نالہ', 'دریا', 'بارش کا پانی'],
    hi: ['बाढ़', 'पानी', 'डूब', 'नदी', 'जलभराव', 'बहाव'],
    zh: ['洪水', '淹水', '涨水', '水位', '进水', '被淹', '溺水', '暴雨积水'],
    fr: ['inondation', 'inonde', 'eau monte', 'noyade', 'crue', 'submersion'],
    de: ['hochwasser', 'ueberschwemmung', 'überschwemmung', 'wasser steigt', 'ertrinken', 'flut'],
    roman: ['sailab', 'seelab', 'pani', 'paani', 'pani bhar', 'doob', 'nala', 'darya', 'flood'],
  },
  fire: {
    en: ['fire', 'flame', 'flames', 'burning', 'burnt', 'smoke', 'gas leak', 'cylinder', 'short circuit', 'blaze', 'stove', 'kitchen fire', 'lpg'],
    ur: ['آگ', 'شعلہ', 'جل', 'دھواں', 'گیس', 'سلنڈر', 'چولہا', 'آتشزدگی'],
    hi: ['आग', 'ज्वाला', 'जल', 'धुआं', 'धुआँ', 'गैस', 'सिलेंडर', 'चूल्हा'],
    zh: ['火灾', '着火', '起火', '火焰', '浓烟', '燃气泄漏', '煤气', '短路'],
    fr: ['incendie', 'feu', 'flammes', 'fumee', 'fumée', 'fuite de gaz', 'court-circuit'],
    de: ['brand', 'feuer', 'flammen', 'rauch', 'gasleck', 'kurzschluss'],
    roman: ['aag', 'jal rahi', 'jal raha', 'dhuan', 'dhuaan', 'gas leak', 'cylinder', 'chulha', 'shortcircuit', 'fire'],
  },
  earthquake: {
    en: ['earthquake', 'quake', 'tremor', 'aftershock', 'shaking', 'building collapse', 'collapsed', 'trapped under', 'rubble', 'seismic'],
    ur: ['زلزلہ', 'زلزلے', 'جھٹکے', 'ہل', 'ملبہ', 'عمارت گر', 'دیوار گر'],
    hi: ['भूकंप', 'भूकम्प', 'झटके', 'हिल', 'मलबा', 'इमारत गिर'],
    zh: ['地震', '余震', '震动', '房屋倒塌', '废墟', '晃动'],
    fr: ['seisme', 'séisme', 'tremblement de terre', 'secousse', 'effondrement'],
    de: ['erdbeben', 'nachbeben', 'erschuetterung', 'erschütterung', 'einsturz'],
    roman: ['zalzala', 'zalzale', 'bhukamp', 'bhookamp', 'jhatke', 'hil raha', 'malba', 'earthquake', 'building gir'],
  },
  storm: {
    en: ['storm', 'thunder', 'lightning', 'heavy rain', 'rainfall', 'wind', 'windstorm', 'hail', 'cyclone', 'gale', 'roof blown'],
    ur: ['طوفان', 'آندھی', 'بجلی', 'گرج', 'تیز بارش', 'ژالہ', 'ہوا'],
    hi: ['तूफान', 'तूफ़ान', 'आंधी', 'बिजली', 'गरज', 'तेज बारिश', 'ओले', 'हवा'],
    zh: ['暴风雨', '台风', '雷电', '雷暴', '大风', '冰雹', '飓风'],
    fr: ['tempete', 'tempête', 'orage', 'foudre', 'tonnerre', 'cyclone', 'ouragan'],
    de: ['sturm', 'gewitter', 'blitz', 'donner', 'unwetter', 'zyklon', 'hagel'],
    roman: ['toofan', 'toofaan', 'aandhi', 'andhi', 'bijli', 'garaj', 'tez barish', 'baarish', 'storm', 'hawa'],
  },
  'road-accident': {
    en: ['accident', 'crash', 'collision', 'car hit', 'bike hit', 'motorway', 'road', 'vehicle', 'truck', 'hit and run', 'overturned'],
    ur: ['حادثہ', 'ایکسیڈنٹ', 'ٹکر', 'گاڑی', 'موٹر سائیکل', 'سڑک', 'ٹرک'],
    hi: ['दुर्घटना', 'एक्सीडेंट', 'टक्कर', 'गाड़ी', 'मोटरसाइकिल', 'सड़क', 'ट्रक'],
    zh: ['车祸', '交通事故', '相撞', '撞车', '翻车'],
    fr: ['accident de la route', 'accident', 'collision', 'vehicule', 'véhicule'],
    de: ['verkehrsunfall', 'unfall', 'kollision', 'zusammenstoss', 'zusammenstoß'],
    roman: ['accident', 'haadsa', 'hadsa', 'takkar', 'gaari', 'gari', 'motorcycle', 'sarak', 'road accident', 'truck'],
  },
  'medical-emergency': {
    en: ['bleeding', 'unconscious', 'not breathing', 'breathing', 'heart attack', 'chest pain', 'cpr', 'choking', 'seizure', 'fracture', 'burn wound', 'snake bite', 'poison', 'faint', 'stroke', 'injured', 'wound', 'pregnant', 'diabetic'],
    ur: ['خون', 'بے ہوش', 'سانس', 'دل کا دورہ', 'سینے میں درد', 'دم گھٹ', 'دورہ', 'فریکچر', 'زخم', 'زہر', 'سانپ', 'زخمی'],
    hi: ['खून', 'बेहोश', 'सांस', 'दिल का दौरा', 'सीने में दर्द', 'दम घुट', 'दौरा', 'फ्रैक्चर', 'घाव', 'जहर', 'सांप', 'घायल'],
    zh: ['流血', '昏迷', '失去知觉', '停止呼吸', '呼吸困难', '心脏病', '骨折', '烧伤', '中毒', '蛇咬', '重伤'],
    fr: ['hemorragie', 'hémorragie', 'saigne', 'inconscient', 'ne respire plus', 'arret cardiaque', 'arrêt cardiaque', 'etouffement'],
    de: ['blutung', 'bewusstlos', 'atmet nicht', 'herzinfarkt', 'herzstillstand', 'atemnot', 'fraktur', 'knochenbruch'],
    roman: ['khoon', 'behosh', 'be hosh', 'saans', 'dil ka dora', 'seene mein dard', 'dam ghut', 'dora', 'fracture', 'zakhm', 'zakhmi', 'zeher', 'saanp', 'chot', 'dard', 'bemar', 'bimar'],
  },
};

// Words that signal an in-progress emergency rather than a "how do I prepare" question.
const URGENCY_MARKERS = [
  'help', 'emergency', 'now', 'right now', 'urgent', 'immediately', 'quick', 'save', 'dying', 'trapped', 'stuck',
  'مدد', 'ہنگامی', 'ابھی', 'فوری', 'جلدی', 'بچاؤ', 'پھنس',
  'मदद', 'आपातकाल', 'अभी', 'तुरंत', 'जल्दी', 'बचाओ', 'फंस',
  '救命', '紧急', '马上', '立刻', '危险',
  'aidez-moi', 'urgence', 'immediatement', 'immédiatement', 'sauver',
  'hilfe', 'notfall', 'sofort', 'dringend', 'rettung',
  'madad', 'madat', 'bachao', 'jaldi', 'foran', 'fori', 'abhi', 'phans', 'phansa', 'phasa',
];

// Life-threatening conditions are urgent even when the message is calm and
// contains no "help" or "now". Missing this would bury the call-first advice.
const CRITICAL_MARKERS = [
  'not breathing', 'cannot breathe', "can't breathe", 'stopped breathing', 'no pulse', 'unconscious',
  'unresponsive', 'collapsed', 'heart attack', 'cardiac arrest', 'chest pain', 'stroke', 'choking',
  'seizure', 'severe bleeding', 'heavy bleeding', 'bleeding a lot', 'drowning', 'electrocuted',
  'سانس نہیں', 'سانس بند', 'بے ہوش', 'دل کا دورہ', 'سینے میں درد', 'دم گھٹ', 'شدید خون', 'ڈوب رہا',
  'सांस नहीं', 'सांस बंद', 'बेहोश', 'दिल का दौरा', 'सीने में दर्द', 'दम घुट', 'तेज खून', 'डूब रहा',
  '没有呼吸', '停止呼吸', '失去知觉', '昏迷', '心脏病发作', '大出血', '溺水',
  'ne respire plus', 'inconscient', 'arret cardiaque', 'arrêt cardiaque', 'saignement abondant',
  'atmet nicht', 'bewusstlos', 'herzstillstand', 'starke blutung',
  'saans nahi', 'sans nahi', 'saans band', 'behosh', 'be hosh', 'dil ka dora', 'dam ghut', 'doob raha',
];

// Present-tense phrasing that indicates the event is happening to the user.
const ACTIVE_PATTERNS = [
  /\b(is|are|has|have)\s+(happening|entering|rising|burning|bleeding|trapped)\b/i,
  /\bmy (house|home|kitchen|room|street|car|father|mother|child|brother|sister)\b/i,
  /میرے|میری|مجھے|ہمارے/,
  /मेरे|मेरी|मुझे|हमारे/,
  /我的|我们/,
  /\b(mon|ma|mes|notre)\b/i,
  /\b(mein|meine|unser)\b/i,
  /\bmere\b|\bmera\b|\bmeri\b|\bmujhe\b|\bhamare\b/i,
];

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u093C\u0640\u064B-\u0652\u0670]/g, '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\s'-]+$/u;
const HAN_REGEX = /[\u4E00-\u9FFF]/;
// A letter or a combining mark - i.e. "still inside the same word".
const WORD_CONTINUES = /^[\p{L}\p{M}]/u;

function matchesKeyword(haystack, keyword) {
  const index = haystack.indexOf(keyword);
  if (index === -1) return false;
  if (keyword.includes(' ') || LATIN_ONLY.test(keyword) || HAN_REGEX.test(keyword)) return true;

  return !WORD_CONTINUES.test(haystack.slice(index + keyword.length));
}

/**
 * @param {string} text user message
 * @returns {{disasterType:string|null, confidence:number, scores:Object, urgency:'high'|'normal'}}
 */
function detectDisaster(text) {
  const haystack = normalize(text);
  if (!haystack) {
    return { disasterType: null, confidence: 0, scores: {}, urgency: 'normal' };
  }

  const scores = {};
  for (const [type, groups] of Object.entries(DISASTER_KEYWORDS)) {
    let score = 0;
    for (const list of Object.values(groups)) {
      for (const keyword of list) {
        if (matchesKeyword(haystack, normalize(keyword))) {
          // Multi-word matches are much stronger evidence than single tokens.
          score += keyword.includes(' ') ? 3 : 2;
        }
      }
    }
    if (score > 0) scores[type] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const urgencyHit =
    CRITICAL_MARKERS.some((marker) => matchesKeyword(haystack, normalize(marker))) ||
    URGENCY_MARKERS.some((marker) => matchesKeyword(haystack, normalize(marker))) ||
    ACTIVE_PATTERNS.some((pattern) => pattern.test(text));

  if (ranked.length === 0) {
    return { disasterType: null, confidence: 0, scores, urgency: urgencyHit ? 'high' : 'normal' };
  }

  const [topType, topScore] = ranked[0];
  const secondScore = ranked[1] ? ranked[1][1] : 0;
  const margin = topScore - secondScore;
  const confidence = Math.min(0.95, 0.35 + topScore * 0.1 + margin * 0.05);

  return {
    disasterType: topType,
    confidence: Number(confidence.toFixed(2)),
    scores,
    urgency: urgencyHit ? 'high' : 'normal',
  };
}

module.exports = {
  detectDisaster,
  DISASTER_TYPES: Object.keys(DISASTER_KEYWORDS),
};
