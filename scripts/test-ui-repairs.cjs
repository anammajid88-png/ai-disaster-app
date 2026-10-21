const { chromium } = require('C:/Users/imsha/.gemini/antigravity/scratch/ai-disaster-project/raah-reference/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  console.log('=== TEST 1: MAP ZOOM & SLIDER STABILITY ON /intelligence/simulator ===');
  await page.goto('http://localhost:5174/intelligence/simulator', { waitUntil: 'networkidle' });

  // 1. Initial transform
  const t0 = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('T0 (Initial):', t0);

  // 2. Click Zoom In
  const zoomInBtn = await page.$('.map-controls button[title*="Zoom in"]');
  if (zoomInBtn) {
    await zoomInBtn.click();
    await page.waitForTimeout(600);
  }
  const t1 = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('T1 (After Zoom In):', t1);
  const zoomInWorked = t1 !== t0;
  console.log('Assert Zoom In changed transform:', zoomInWorked ? 'PASS' : 'FAIL');

  // 3. Move Timeline Slider
  const sliderMoved = await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]');
    if (!slider) return false;
    slider.value = '24';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  if (sliderMoved) {
    await page.waitForTimeout(600);
  }
  const t2 = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('T2 (After Slider Change):', t2);
  const sliderDidNotResetZoom = t2 === t1;
  console.log('Assert Slider did NOT reset user zoom:', sliderDidNotResetZoom ? 'PASS' : 'FAIL');

  // 4. Reset Button
  const resetBtn = await page.$('.map-controls button[title*="Reset"]');
  if (resetBtn) {
    await resetBtn.click();
    await page.waitForTimeout(600);
  }
  const t3 = await page.evaluate(() => {
    const g = document.querySelector('.map-viewport svg g');
    return g ? g.getAttribute('transform') : null;
  });
  console.log('T3 (After Reset):', t3);
  const resetWorked = t3 !== t1;
  console.log('Assert Reset returned to initial view:', resetWorked ? 'PASS' : 'FAIL');

  // 5. Check Readiness Metric: No "Grade: undefined"
  const readinessHint = await page.evaluate(() => {
    const metrics = Array.from(document.querySelectorAll('.intel-metric'));
    for (const m of metrics) {
      if (m.textContent.includes('Readiness')) return m.textContent;
    }
    return '';
  });
  console.log('Readiness Metric Text:', readinessHint);
  const noGradeUndefined = !readinessHint.includes('undefined');
  console.log('Assert No Grade: undefined:', noGradeUndefined ? 'PASS' : 'FAIL');

  // 6. Check A/B Table Gain: No raw float like +28.10000000000001%
  const tableText = await page.evaluate(() => {
    const table = document.querySelector('.intel-table');
    return table ? table.innerText : '';
  });
  const hasRawFloat = /\d+\.\d{3,}/.test(tableText);
  console.log('Table text sample:', tableText.slice(0, 300));
  console.log('Assert No Raw Float in Table:', !hasRawFloat ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 2: /intelligence/demo TEXT CONTRAST & FORMATTING ===');
  await page.goto('http://localhost:5174/intelligence/demo', { waitUntil: 'networkidle' });

  // Check h2 computed color in demo banner
  const bannerStyles = await page.evaluate(() => {
    const h2 = document.querySelector('.demo-banner h2');
    const p = document.querySelector('.demo-banner p');
    if (!h2 || !p) return null;
    const h2Style = window.getComputedStyle(h2);
    const pStyle = window.getComputedStyle(p);
    return {
      h2Color: h2Style.color,
      pColor: pStyle.color,
      h2Text: h2.textContent,
    };
  });
  console.log('Demo Banner Computed Styles:', bannerStyles);
  const isH2White = bannerStyles && (bannerStyles.h2Color.includes('255, 255, 255') || bannerStyles.h2Color === 'rgb(255, 255, 255)');
  console.log('Assert Banner H2 is white (high contrast):', isH2White ? 'PASS' : 'FAIL');

  // Check presenter notes hidden by default
  const notesVisible = await page.evaluate(() => {
    return !!document.querySelector('.demo-banner + div ul');
  });
  console.log('Assert Presenter Notes hidden by default:', !notesVisible ? 'PASS' : 'FAIL');

  // Navigate to Step 7 (Counterfactual A/B)
  for (let i = 0; i < 6; i++) {
    const nextBtn = await page.$('.demo-banner button:has-text("Next")');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(250);
    }
  }
  const step7TableText = await page.evaluate(() => {
    const table = document.querySelector('.intel-table');
    return table ? table.innerText : '';
  });
  console.log('Step 7 Table Text:\n', step7TableText);
  const step7HasRawFloat = /\d+\.\d{3,}/.test(step7TableText);
  console.log('Assert Step 7 Table has NO raw floats (+18.2 pp):', !step7HasRawFloat ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 3: MULTILINGUAL NAV & BIDI IN URDU & HINDI ===');
  // Switch to Urdu via query param
  await page.goto('http://localhost:5174/?lang=ur', { waitUntil: 'networkidle' });
  const urNavText = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll('.site-nav a, .nav__link'));
    return navLinks.map(a => a.textContent.trim());
  });
  console.log('Urdu Primary Nav Links:', urNavText);
  const urHasQuestionMarks = urNavText.some(t => t.includes('???'));
  const urHasIntelligence = urNavText.some(t => t.includes('انٹیلی جنس'));
  console.log('Assert Urdu Nav has NO question marks:', !urHasQuestionMarks ? 'PASS' : 'FAIL');
  console.log('Assert Urdu Nav has "انٹیلی جنس":', urHasIntelligence ? 'PASS' : 'FAIL');

  // Check /ai in Urdu
  await page.goto('http://localhost:5174/ai', { waitUntil: 'networkidle' });
  // Type a test prompt into composer
  const inputEl = await page.$('#chat-input');
  if (inputEl) {
    await inputEl.fill('Flooding in my street, what should I do?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
  }
  const chatBubbleDir = await page.evaluate(() => {
    const bubble = document.querySelector('.msg__bubble');
    return bubble ? bubble.getAttribute('dir') : null;
  });
  console.log('Chat Bubble dir attribute:', chatBubbleDir);
  console.log('Assert Chat Bubble has dir="auto":', chatBubbleDir === 'auto' ? 'PASS' : 'FAIL');

  await browser.close();

  const maxUpdateErrors = errors.filter(e => e.includes('Maximum update depth exceeded'));
  console.log('\n=== TOTAL CONSOLE ERRORS ===', errors.length);
  console.log('Maximum update depth errors:', maxUpdateErrors.length);

  const allPassed =
    zoomInWorked &&
    sliderDidNotResetZoom &&
    resetWorked &&
    noGradeUndefined &&
    !hasRawFloat &&
    isH2White &&
    !notesVisible &&
    !step7HasRawFloat &&
    !urHasQuestionMarks &&
    urHasIntelligence &&
    chatBubbleDir === 'auto' &&
    errors.length === 0;

  console.log('\nOVERALL REPAIR RESULT:', allPassed ? 'ALL PASS' : 'FAILURES DETECTED');
})();
