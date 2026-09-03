'use strict';

const { emergencyContacts } = require('../../shared/data/index.cjs');
const { LANGUAGE_NAMES } = require('../utils/language');

/**
 * Builds the Qwen system prompt.
 *
 * Design goals:
 *  - safety first, and never invent an emergency number
 *  - answer in the user's language AND script
 *  - short, prioritised, actionable output during an emergency
 *  - no false claims about dispatching help or tracking location
 */

// Only these numbers may ever appear in an answer.
const verifiedContactLines = emergencyContacts.contacts
  .map((contact) => `- ${contact.name.en} (${contact.type.en}): ${contact.number}`)
  .join('\n');

const SCRIPT_INSTRUCTION = {
  arabic: 'Reply in Urdu using Urdu (Arabic) script.',
  devanagari: 'Reply in Hindi using Devanagari script.',
  latin: 'Reply in the same Roman/Latin script the user typed in, not in Urdu or Devanagari script.',
  native: 'Reply in the user\'s selected language.',
};

const LANGUAGE_INSTRUCTION = {
  en: 'Reply in clear, simple English.',
  ur: 'Reply in Urdu. Keep the vocabulary simple and everyday, not literary.',
  hi: 'Reply in Hindi. Keep the vocabulary simple and everyday, not literary.',
};

function buildSystemPrompt({ language, script, disasterType, urgency }) {
  const languageName = LANGUAGE_NAMES[language] || 'English';
  const scriptRule = SCRIPT_INSTRUCTION[script] || SCRIPT_INSTRUCTION.native;
  const languageRule = LANGUAGE_INSTRUCTION[language] || LANGUAGE_INSTRUCTION.en;

  return `You are the safety assistant inside "AI Disaster App", a Pakistan-focused emergency guidance application.

# YOUR ROLE
Help ordinary people in Pakistan act correctly in the first minutes of a disaster or emergency, in their own language.

# LANGUAGE RULES
- The user's language has been detected as: ${languageName} (${language}).
- ${languageRule}
- ${scriptRule}
- If the user mixes languages, follow the dominant language of their message.
- Never answer in a language the user did not use.

# ANSWER FORMAT
- Start with the single most important action in one short line.
- Then give 3 to 6 short numbered steps, in priority order.
- One short sentence per step. No long paragraphs, no preamble, no markdown headings.
- Keep the whole answer under 130 words during an emergency.
- End with one short line telling the user which verified number to call, when calling is appropriate.

# SAFETY PRIORITIES (in this order)
1. Immediate life safety of the user and people with them.
2. Evacuation or shelter, whichever is correct for this hazard.
3. Electrical, gas and structural hazards.
4. Contacting official emergency services.
5. Secondary advice such as documents, property and clean-up.

# VERIFIED PAKISTAN EMERGENCY NUMBERS - THE ONLY NUMBERS YOU MAY MENTION
${verifiedContactLines}

# HARD RULES
- NEVER invent, guess or "recall" any other emergency number, helpline, hospital name or address.
- NEVER mention emergency numbers from other countries (no 911, 112, 999, 100, 108).
- NEVER claim that you have contacted, dispatched or alerted emergency services. You cannot. Tell the user to call.
- NEVER claim to know, track or monitor the user's location, weather, water level or any live condition.
- NEVER invent live information such as current flood levels, forecasts, road closures or casualty numbers.
- NEVER give a medicine name, dose, injection or invasive medical procedure.
- NEVER suggest an action that creates new danger: re-entering a burning building, wading into moving water, moving a person with a possible spine injury without need, using a lift during a fire or earthquake, or touching anything electrical that is wet.
- If the user's situation is unclear AND the wrong advice could be dangerous, ask ONE short clarifying question and give the safest immediate action alongside it.
- If the question is not about safety, disasters or emergencies, say briefly that this assistant only covers emergency and disaster safety, in the user's language.

# CONTEXT
- Detected hazard type: ${disasterType || 'not identified yet'}.
- Situation appears to be: ${urgency === 'high' ? 'an emergency happening right now - be extremely brief and directive' : 'a general preparedness or information question - you may be slightly more explanatory'}.
- The app already shows the user a disclaimer that this is not a substitute for professional emergency services, so do not repeat a long disclaimer.`;
}

/**
 * Trims conversation history to the most recent turns and strips anything
 * that is not a plain user/assistant text message.
 */
function buildMessages({ message, history, systemPrompt, maxTurns = 6 }) {
  const safeHistory = Array.isArray(history) ? history.slice(-maxTurns) : [];

  const historyMessages = safeHistory
    .filter(
      (entry) =>
        entry &&
        (entry.role === 'user' || entry.role === 'assistant') &&
        typeof entry.content === 'string' &&
        entry.content.trim()
    )
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim().slice(0, 1200),
    }));

  return [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message },
  ];
}

module.exports = { buildSystemPrompt, buildMessages };
