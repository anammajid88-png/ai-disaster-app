const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve('C:/Users/imsha/.gemini/antigravity/scratch/ai-disaster-project/raah-reference/node_modules/playwright'));

const outDir = 'C:/Users/imsha/.gemini/antigravity/scratch/ai-disaster-project/screenshots/audit';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: 'desktop_1440', width: 1440, height: 900, isMobile: false },
  { name: 'laptop_1366', width: 1366, height: 768, isMobile: false },
  { name: 'tablet_768', width: 768, height: 1024, isMobile: false },
  { name: 'mobile_390', width: 390, height: 844, isMobile: true },
  { name: 'mobile_360', width: 360, height: 740, isMobile: true }
];

const coreRoutes = [
  { id: 'simulator', path: '/intelligence/simulator' },
  { id: 'evacuation', path: '/intelligence/evacuation' },
  { id: 'map', path: '/intelligence/map' },
  { id: 'demo_step1', path: '/intelligence/demo' },
  { id: 'methodology', path: '/intelligence/methodology' },
  { id: 'overview', path: '/intelligence' },
  { id: 'risk', path: '/intelligence/risk' },
  { id: 'resources', path: '/intelligence/resources' },
  { id: 'live', path: '/intelligence/live' },
  { id: 'ai_en', path: '/ai' },
  { id: 'ai_ur', path: '/ai?lang=ur' },
  { id: 'ai_hi', path: '/ai?lang=hi' },
  { id: 'home', path: '/' },
  { id: 'emergency', path: '/emergency' },
  { id: 'about', path: '/about' }
];

async function runAudit() {
  console.log('Starting Multi-Viewport Audit & Screenshot Capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  // 1. Capture across viewports
  for (const vp of viewports) {
    console.log(`\n--- Capturing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      userAgent: vp.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        : undefined
    });
    const page = await context.newPage();

    for (const r of coreRoutes) {
      try {
        await page.goto(`http://localhost:5174${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(600);
        const filename = `${vp.name}_${r.id}.png`;
        await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
        console.log(`Saved: ${filename}`);
      } catch (err) {
        console.warn(`Error capturing ${r.id} on ${vp.name}: ${err.message}`);
      }
    }
    await context.close();
  }

  // 2. Specific Zoom and Pan Action Capture (Desktop 1440)
  console.log('\n--- Capturing Interactive Map Zoom Sequence ---');
  const zoomContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const zoomPage = await zoomContext.newPage();
  
  // Go to Simulator map
  await zoomPage.goto('http://localhost:5174/intelligence/simulator', { waitUntil: 'networkidle' });
  await zoomPage.waitForTimeout(600);
  
  // Initial state screenshot
  await zoomPage.screenshot({ path: path.join(outDir, 'zoom_01_default_simulator.png') });
  console.log('Saved: zoom_01_default_simulator.png');

  // Find and click Zoom In (+) button twice
  const zoomInBtn = zoomPage.locator('button[aria-label="Zoom in"]');
  if (await zoomInBtn.count() > 0) {
    await zoomInBtn.click();
    await zoomPage.waitForTimeout(300);
    await zoomInBtn.click();
    await zoomPage.waitForTimeout(300);
    await zoomPage.screenshot({ path: path.join(outDir, 'zoom_02_zoomed_in_simulator.png') });
    console.log('Saved: zoom_02_zoomed_in_simulator.png');

    // Click Reset (0) button
    const resetBtn = zoomPage.locator('button[aria-label="Reset view"]');
    if (await resetBtn.count() > 0) {
      await resetBtn.click();
      await zoomPage.waitForTimeout(300);
      await zoomPage.screenshot({ path: path.join(outDir, 'zoom_03_reset_simulator.png') });
      console.log('Saved: zoom_03_reset_simulator.png');
    }
  }

  // 3. Demo Step 7 Vector Map Capture
  console.log('\n--- Capturing Demo Step 7 ---');
  await zoomPage.goto('http://localhost:5174/intelligence/demo', { waitUntil: 'networkidle' });
  await zoomPage.waitForTimeout(500);
  // Advance to step 7 (click Next 6 times)
  for (let i = 1; i <= 6; i++) {
    const nextBtn = zoomPage.locator('button:has-text("Next Step")');
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await zoomPage.waitForTimeout(200);
    }
  }
  await zoomPage.screenshot({ path: path.join(outDir, 'desktop_1440_demo_step7.png') });
  console.log('Saved: desktop_1440_demo_step7.png');

  // Toggle presenter notes on Demo
  const notesToggleBtn = zoomPage.locator('button[title*="Toggle Presenter Notes"], button:has-text("Presenter Notes")');
  if (await notesToggleBtn.count() > 0) {
    await notesToggleBtn.click();
    await zoomPage.waitForTimeout(300);
    await zoomPage.screenshot({ path: path.join(outDir, 'desktop_1440_demo_presenter_notes_visible.png') });
    console.log('Saved: desktop_1440_demo_presenter_notes_visible.png');
  }

  await zoomContext.close();
  await browser.close();
  console.log('\nAudit screenshots successfully generated in:', outDir);
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
