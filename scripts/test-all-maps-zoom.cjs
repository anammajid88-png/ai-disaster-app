const { chromium } = require('C:/Users/imsha/.gemini/antigravity/scratch/ai-disaster-project/raah-reference/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const routes = [
    '/intelligence/evacuation',
    '/intelligence/map',
    '/intelligence/demo',
    '/intelligence/live',
    '/intelligence',
  ];

  console.log('Testing zoom on all map routes:');
  for (const route of routes) {
    await page.goto(`http://localhost:5174${route}`, { waitUntil: 'networkidle' });
    const initialT = await page.evaluate(() => {
      const g = document.querySelector('.map-viewport svg g');
      return g ? g.getAttribute('transform') : null;
    });

    const zoomInBtn = await page.$('.map-controls button[title*="Zoom in"]');
    if (zoomInBtn) {
      await zoomInBtn.click();
      await page.waitForTimeout(500);
    }
    const afterZoomT = await page.evaluate(() => {
      const g = document.querySelector('.map-viewport svg g');
      return g ? g.getAttribute('transform') : null;
    });

    const changed = initialT !== afterZoomT && afterZoomT !== null;
    console.log(`Route ${route}: Zoom In changed transform:`, changed ? 'PASS' : 'FAIL', `(${initialT} -> ${afterZoomT})`);
  }

  await browser.close();
})();
