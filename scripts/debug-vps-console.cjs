const path = require('path');
const { chromium } = require(path.resolve('C:/Users/imsha/.gemini/antigravity/scratch/ai-disaster-project/raah-reference/node_modules/playwright'));

async function debug() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

  console.log('Navigating to simulator...');
  await page.goto('https://demo.zztechlabs.com/anam/intelligence/simulator', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const html = await page.content();
  console.log('Body length:', html.length);
  if (html.includes('CrashScreen') || html.includes('boundaryTitle') || html.includes('Something went wrong')) {
    console.log('CRASH SCREEN DETECTED!');
  }

  console.log('\nNavigating to AI Help...');
  await page.goto('https://demo.zztechlabs.com/anam/ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await browser.close();
}

debug().catch(console.error);
