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
    roman: ['sailab', 'seelab', 'pani', 'paani', 'pani bhar', 'doob', 'doob', 'nala', 'darya', 'flood'],
  },
  fire: {
    en: ['fire', 'flame', 'flames', 'burning', 'burnt', 'smoke', 'gas leak', 'cylinder', 'short circuit', 'blaze', 'stove', 'kitchen fire', 'lpg'],
    ur: ['آگ', 'شعلہ', 'جل', 'دھواں', 'گیس', 'سلنڈر', 'چولہا', 'آتشزدگی'],
    hi: ['आग', 'ज्वाला', 'जल', 'धुआं', 'धुआँ', 'गैस', 'सिलेंडर', 'चूल्हा'],
    roman: ['aag', 'jal rahi', 'jal raha', 'dhuan', 'dhuaan', 'gas leak', 'cylinder', 'chulha', 'shortcircuit', 'fire'],
  },
  earthquake: {
    en: ['earthquake', 'quake', 'tremor', 'aftershock', 'shaking', 'building collapse', 'collapsed', 'trapped under', 'rubble', 'seismic'],
    ur: ['زلزلہ', 'زلزلے', 'جھٹکے', 'ہل', 'ملبہ', 'عمارت گر', 'دیوار گر'],
    hi: ['भूकंप', 'भूकम्प', 'झटके', 'हिल', 'मलबा', 'इमारत गिर'],
    roman: ['zalzala', 'zalzale', 'bhukamp', 'bhookamp', 'jhatke', 'hil raha', 'malba', 'earthquake', 'building gir'],
  },
  storm: {
    en: ['storm', 'thunder', 'lightning', 'heavy rain', 'rainfall', 'wind', 'windstorm', 'hail', 'cyclone', 'gale', 'roof blown'],
    ur: ['طوفان', 'آندھی', 'بجلی', 'گرج', 'تیز بارش', 'ژالہ', 'ہوا'],
    hi: ['तूफान', 'तूफ़ान', 'आंधी', 'बिजली', 'गरज', 'तेज बारिश', 'ओले', 'हवा'],
    roman: ['toofan', 'toofaan', 'aandhi', 'andhi', 'bijli', 'garaj', 'tez barish', 'baarish', 'storm', 'hawa'],
  },
  'road-accident': {
    en: ['accident', 'crash', 'collision', 'car hit', 'bike hit', 'motorway', 'road', 'vehicle', 'truck', 'hit and run', 'overturned'],
    ur: ['حادثہ', 'ایکسیڈنٹ', 'ٹکر', 'گاڑی', 'موٹر سائیکل', 'سڑک', 'ٹرک'],
    hi: ['दुर्घटना', 'एक्सीडेंट', 'टक्कर', 'गाड़ी', 'मोटरसाइकिल', 'सड़क', 'ट्रक'],
    roman: ['accident', 'haadsa', 'hadsa', 'takkar', 'gaari', 'gari', 'motorcycle', 'sarak', 'road accident', 'truck'],
  },
  'medical-emergency': {
    en: ['bleeding', 'unconscious', 'not breathing', 'breathing', 'heart attack', 'chest pain', 'cpr', 'choking', 'seizure', 'fracture', 'burn wound', 'snake bite', 'poison', 'faint', 'stroke', 'injured', 'wound', 'pregnant', 'diabetic'],
    ur: ['خون', 'بے ہوش', 'سانس', 'دل کا دورہ', 'سینے میں درد', 'دم گھٹ', 'دورہ', 'فریکچر', 'زخم', 'زہر', 'سانپ', 'زخمی'],
    hi: ['खून', 'बेहोश', 'सांस', 'दिल का दौरा', 'सीने में दर्द', 'दम घुट', 'दौरा', 'फ्रैक्चर', 'घाव', 'जहर', 'सांप', 'घायल'],
    roman: ['khoon', 'behosh', 'be hosh', 'saans', 'dil ka dora', 'seene mein dard', 'dam ghut', 'dora', 'fracture', 'zakhm', 'zakhmi', 'zeher', 'saanp', 'chot', 'dard', 'bemar', 'bimar'],
  },
};

// Words that signal an in-progress emergency rather than a "how do I prepare" question.
const URGENCY_MARKERS = [
  'help', 'emergency', 'now', 'right now', 'urgent', 'immediately', 'quick', 'save', 'dying', 'trapped', 'stuck',
  'مدد', 'ہنگامی', 'ابھی', 'فوری', 'جلدی', 'بچاؤ', 'پھنس',
  'मदद', 'आपातकाल', 'अभी', 'तुरंत', 'जल्दी', 'बचाओ', 'फंस',
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
  'saans nahi', 'sans nahi', 'saans band', 'behosh', 'be hosh', 'dil ka dora', 'dam ghut', 'doob raha',
];

// Present-tense phrasing that indicates the event is happening to the user.
const ACTIVE_PATTERNS = [
  /\b(is|are|has|have)\s+(happening|entering|rising|burning|bleeding|trapped)\b/i,
  /\bmy (house|home|kitchen|room|street|car|father|mother|child|brother|sister)\b/i,
  /میرے|میری|مجھے|ہمارے/,
  /मेरे|मेरी|मुझे|हमारे/,
  /\bmere\b|\bmera\b|\bmeri\b|\bmujhe\b|\bhamare\b/i,
];

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    // Strip the Devanagari nukta and Arabic/Urdu diacritics so that spellings
    // like "ख़ून" and "खून" - identical to a reader, different codepoints - are
    // treated as the same word.
    .normalize('NFD')
    .replace(/[\u093C\u0640\u064B-\u0652\u0670]/g, '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\s'-]+$/u;
// A letter or a combining mark - i.e. "still inside the same word".
const WORD_CONTINUES = /^[\p{L}\p{M}]/u;

/**
 * Does `haystack` contain `keyword` as a word rather than as a fragment?
 *
 * Short Urdu and Hindi stems collide badly with unrelated words: "ہل" (shake)
 * sits inside "پہلے" (first), "جل" (burn) inside "جلدی" (quickly), and "जल"
 * inside "जलभराव" (waterlogging). Plain substring matching therefore routed a
 * bleeding question to earthquake guidance. For non-Latin keywords we require
 * that the match is not followed by more of the same word. Trailing position is
 * enough: these scripts inflect by suffix, and checking the front would break
 * the common "<stem> رہا ہے" phrasings this list is built around.
 *
 * Latin keywords keep substring matching on purpose, so stems such as "drown"
 * still catch "drowning".
 */
function matchesKeyword(haystack, keyword) {
  const index = haystack.indexOf(keyword);
  if (index === -1) return false;
  if (keyword.includes(' ') || LATIN_ONLY.test(keyword)) return true;

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
