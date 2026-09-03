/**
 * End-to-end smoke test for the API and the built client.
 *
 *   node scripts/smoke-test.mjs [baseUrl]
 *
 * Checks real HTTP behaviour: health, multilingual chat, disaster detection,
 * validation errors, static assets and the SPA history fallback. It never
 * requires a live Qwen key - the fallback path is a supported answer source.
 */

const base = (process.argv[2] || 'http://localhost:5050').replace(/\/$/, '');

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

async function getJson(path) {
  const response = await fetch(`${base}${path}`);
  return { status: response.status, body: await response.json() };
}

async function chat(message, language, extra = {}) {
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language, ...extra }),
  });

  return { status: response.status, body: await response.json() };
}

function hasScript(text, range) {
  return new RegExp(`[${range}]`).test(text);
}

/* ------------------------------------------------------------------ Runs */

console.log(`\nAI Disaster App smoke test against ${base}\n`);

console.log('Health and content');
{
  const { status, body } = await getJson('/api/health');
  check('GET /api/health returns 200', status === 200, `got ${status}`);
  check('health reports success', body.success === true);
  check('health reports ai configuration state', typeof body.ai?.configured === 'boolean');
  check(
    'health never leaks a key',
    !JSON.stringify(body).match(/sk-[a-zA-Z0-9]{6,}/),
    'response contained a key-like string'
  );
}
{
  const { status, body } = await getJson('/api/content/disasters');
  check('GET /api/content/disasters returns 200', status === 200, `got ${status}`);
  check('exactly 6 disaster categories', body.disasters?.length === 6, `got ${body.disasters?.length}`);
  check(
    'every category has en/ur/hi content',
    body.disasters?.every((d) => d.content?.en && d.content?.ur && d.content?.hi)
  );
  check(
    'every category has rightNow steps',
    body.disasters?.every((d) => d.content.en.rightNow?.length > 0)
  );
}
{
  const { status, body } = await getJson('/api/content/emergency-contacts');
  check('GET /api/content/emergency-contacts returns 200', status === 200, `got ${status}`);
  check('contacts are verified with a source', body.contacts?.every((c) => c.verified && c.source?.organisation));
  check(
    'only recognised Pakistan numbers are present',
    body.contacts?.every((c) => ['1122', '15', '16', '115', '130'].includes(c.number)),
    body.contacts?.map((c) => c.number).join(', ')
  );
  check(
    'contact warning is translated into all three languages',
    ['en', 'ur', 'hi'].every((lang) => typeof body.meta?.warning?.[lang] === 'string')
  );
}
{
  const { status, body } = await getJson('/api/content/emergency-kit');
  check('GET /api/content/emergency-kit returns 200', status === 200, `got ${status}`);
  check('kit has 10 items', body.items?.length === 10, `got ${body.items?.length}`);
  check(
    'every kit item is translated into all three languages',
    body.items?.every((item) => item.label?.en && item.label?.ur && item.label?.hi)
  );
}

console.log('\nChat: language handling');
{
  const { status, body } = await chat('Flood water is entering my house, what should I do?', 'en');
  check('English flood question returns 200', status === 200, `got ${status}`);
  check('answer is present', typeof body.answer === 'string' && body.answer.length > 40);
  check('source is labelled ai or fallback', ['ai', 'fallback'].includes(body.source), body.source);
  check('flood is detected', body.disasterType === 'flood', String(body.disasterType));
  check('language echoed as en', body.language === 'en', body.language);
}
{
  const { body } = await chat('gas ki bo aa rahi hai aur ghar mein aag lag gayi hai', 'ur');
  check('Roman Urdu fire question detects fire', body.disasterType === 'fire', String(body.disasterType));
  check('Urdu request answers in Urdu script', hasScript(body.answer, '\\u0600-\\u06FF'), body.answer.slice(0, 60));
}
{
  const { body } = await chat('भूकंप आ रहा है, मैं क्या करूँ?', 'hi');
  check('Hindi earthquake question detects earthquake', body.disasterType === 'earthquake', String(body.disasterType));
  check('Hindi request answers in Devanagari', hasScript(body.answer, '\\u0900-\\u097F'), body.answer.slice(0, 60));
}
{
  const { body } = await chat('Someone collapsed and is not breathing', 'en');
  check('medical emergency is detected', body.disasterType === 'medical-emergency', String(body.disasterType));
  // A calm sentence about a life-threatening symptom must still read as urgent.
  check('urgency is reported as high', body.urgency === 'high', String(body.urgency));
}
{
  const { body } = await chat('A car crashed on the motorway and someone is trapped', 'en');
  check('road accident is detected', body.disasterType === 'road-accident', String(body.disasterType));
}
{
  const { body } = await chat('Heavy rain and lightning, our roof is leaking', 'en');
  check('storm is detected', body.disasterType === 'storm', String(body.disasterType));
}

console.log('\nChat: safety guarantees');
{
  const { body } = await chat('Flood water is rising fast in my street', 'en');
  const invented = body.answer.match(/\b(?:9\d{2}|1\d{3}|\d{3})\b/g) || [];
  const allowed = new Set(['1122', '15', '16', '115', '130']);
  const numbers = body.answer.match(/\b\d{2,4}\b/g) || [];
  check(
    'no emergency number outside the verified list',
    numbers.filter((n) => n.length >= 2 && !allowed.has(n) && Number(n) < 2000).length === 0,
    `saw ${numbers.join(', ')} (${invented.length} candidates)`
  );
  check('answer stays concise', body.answer.length < 1600, `${body.answer.length} chars`);
  check(
    'fallback answers carry a notice',
    body.source === 'ai' || Boolean(body.notice?.messageKey),
    JSON.stringify(body.notice)
  );
}

console.log('\nChat: validation and errors');
{
  const { status, body } = await chat('   ', 'en');
  check('empty message rejected with 400', status === 400, `got ${status}`);
  check('error carries an i18n key', typeof body.error?.messageKey === 'string', JSON.stringify(body.error));
}
{
  // The API answers 413 for an oversized message; the client maps the
  // messageKey, not the status, so the user still sees a plain sentence.
  const { status, body } = await chat('x'.repeat(2000), 'en');
  check('over-long message rejected with 413', status === 413, `got ${status}`);
  check('over-long error carries an i18n key', body.error?.messageKey === 'errors.messageTooLong', JSON.stringify(body.error));
}
{
  const { status, body } = await chat('Fire in my kitchen', 'fr');
  check('unsupported language falls back instead of failing', status === 200, `got ${status}`);
  check('language coerced to a supported one', ['en', 'ur', 'hi'].includes(body.language), body.language);
}
{
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"message":',
  });
  check('malformed JSON returns 4xx, not a crash', response.status >= 400 && response.status < 500, `got ${response.status}`);
}
{
  const { status, body } = await getJson('/api/does-not-exist');
  check('unknown API route returns 404 JSON', status === 404, `got ${status}`);
  check('404 has no stack trace', !JSON.stringify(body).includes('at '), JSON.stringify(body).slice(0, 80));
}

console.log('\nStatic hosting and PWA');
for (const path of [
  '/',
  '/manifest.webmanifest',
  '/service-worker.js',
  '/robots.txt',
  '/sitemap.xml',
  '/og-image.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
]) {
  const response = await fetch(`${base}${path}`);
  check(`GET ${path} returns 200`, response.status === 200, `got ${response.status}`);
}
{
  const response = await fetch(`${base}/emergency`);
  const html = await response.text();
  check('deep link /emergency serves the SPA shell', response.status === 200 && html.includes('<div id="root">'));
  check('shell includes the canonical tag', html.includes('rel="canonical"'));
  check('shell includes the OG image', html.includes('og-image.png'));
  check('shell has a noscript emergency fallback', html.includes('<noscript>'));
  check('shell never contains a key placeholder', !/ALIBABA_API_KEY|sk-[a-zA-Z0-9]{6,}/.test(html));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
