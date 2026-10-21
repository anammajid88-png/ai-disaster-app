const { chromium } = require('C:/Users/imsha/.gemini/antigravity/scratch/ai-disaster-project/raah-reference/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to simulator...');
  await page.goto('http://localhost:5174/intelligence/simulator', { waitUntil: 'networkidle' });

  // Check map svg and g transform
  const gTransformBefore = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('Initial g transform:', gTransformBefore);

  // Click zoom in button
  const zoomInBtn = await page.$('.map-controls button[title="Zoom in"]');
  console.log('Zoom in button found:', !!zoomInBtn);
  if (zoomInBtn) {
    await zoomInBtn.click();
    await page.waitForTimeout(500);
  }

  const gTransformAfterClick = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('g transform after zoom in click:', gTransformAfterClick);

  // Try dragging map
  const svgBox = await page.evaluate(() => {
    const svg = document.querySelector('.map-viewport svg');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });

  if (svgBox) {
    await page.mouse.move(svgBox.x, svgBox.y);
    await page.mouse.down();
    await page.mouse.move(svgBox.x + 100, svgBox.y + 50, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
  }

  const gTransformAfterDrag = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('g transform after drag:', gTransformAfterDrag);

  // Check what happens when a slider changes
  const slider = await page.$('input[type="range"]');
  if (slider) {
    console.log('Moving slider...');
    await slider.fill('2.5');
    await page.waitForTimeout(500);
    const gTransformAfterSlider = await page.evaluate(() => {
      const g = document.querySelector('.map-viewport svg g');
      return g ? g.getAttribute('transform') : null;
    });
    console.log('g transform after slider move:', gTransformAfterSlider);
  }

  // Also check evacuation map and map page
  console.log('\nNavigating to /intelligence/evacuation...');
  await page.goto('http://localhost:5174/intelligence/evacuation', { waitUntil: 'networkidle' });
  const evacTransform = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('Evacuation initial transform:', evacTransform);
  const evacZoomIn = await page.$('.map-controls button[title="Zoom in"]');
  if (evacZoomIn) {
    await evacZoomIn.click();
    await page.waitForTimeout(500);
  }
  const evacTransformAfterZoom = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('Evacuation transform after zoom click:', evacTransformAfterZoom);

  console.log('\nNavigating to /intelligence/map...');
  await page.goto('http://localhost:5174/intelligence/map', { waitUntil: 'networkidle' });
  const mapTransform = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('Map page initial transform:', mapTransform);
  const mapZoomIn = await page.$('.map-controls button[title="Zoom in"]');
  if (mapZoomIn) {
    await mapZoomIn.click();
    await page.waitForTimeout(500);
  }
  const mapTransformAfterZoom = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('Map page transform after zoom click:', mapTransformAfterZoom);

  await browser.close();
  if (errors.length) console.log('Page errors:', errors);
})();
