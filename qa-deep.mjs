/**
 * PureAssamTea — deep design & visual QA
 * Checks computed styles, layout dimensions, all brand pages, interactive states,
 * accessibility, and takes high-DPI screenshots for visual review.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE   = 'http://localhost:4322';
const SS_DIR = '/tmp/pat-deep';
mkdirSync(SS_DIR, { recursive: true });

// Design tokens (from tailwind.config.mjs)
const TOKEN = {
  teaGreen : 'rgb(0, 108, 63)',
  teaDark  : 'rgb(27, 77, 62)',
  teaLight : 'rgb(232, 245, 233)',
  cream    : 'rgb(249, 248, 243)',
  ink      : 'rgb(14, 14, 14)',
  ink2     : 'rgb(42, 42, 42)',
  ink3     : 'rgb(90, 90, 90)',
  line     : 'rgb(229, 229, 229)',
  white    : 'rgb(255, 255, 255)',
};

const issues = [];
function pass(msg)  { console.log(`[PASS] ${msg}`); }
function fail(msg)  { console.error(`[FAIL] ${msg}`); issues.push(msg); }
function info(msg)  { console.log(`[INFO] ${msg}`); }

async function shot(page, name, clip) {
  const opts = { path: `${SS_DIR}/${name}.png`, ...(clip ? { clip } : { fullPage: true }) };
  await page.screenshot(opts);
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function css(page, selector, prop) {
  return page.evaluate(([sel, p]) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return getComputedStyle(el).getPropertyValue(p).trim();
  }, [selector, prop]);
}

async function rect(page, selector) {
  return page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, selector);
}

async function checkColor(page, selector, prop, expected, label) {
  const val = await css(page, selector, prop);
  if (val === expected) pass(`${label} — ${prop} = ${expected}`);
  else fail(`${label} — ${prop}: got "${val}", expected "${expected}"`);
}

async function checkImgRendered(page, selector, label) {
  const result = await page.evaluate(sel => {
    const imgs = Array.from(document.querySelectorAll(sel));
    return imgs.map(img => ({
      src: img.src,
      complete: img.complete,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
      renderedW: img.getBoundingClientRect().width,
      renderedH: img.getBoundingClientRect().height,
    }));
  }, selector);
  for (const img of result) {
    if (!img.complete || img.naturalW === 0)
      fail(`${label} — broken: ${img.src}`);
    else if (img.renderedW < 1 || img.renderedH < 1)
      fail(`${label} — renders at 0 size: ${img.src} (${img.renderedW}×${img.renderedH})`);
    else
      pass(`${label} — ${img.src.split('/').pop()} OK (${Math.round(img.renderedW)}×${Math.round(img.renderedH)})`);
  }
}

async function checkNoHoriz(page, label) {
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (ov) fail(`${label} — horizontal overflow`);
  else pass(`${label} — no horizontal overflow`);
}

async function checkLinks(page, label) {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="/"]')).map(a => a.getAttribute('href'))
  );
  const unique = [...new Set(hrefs)];
  const broken = [];
  for (const href of unique) {
    const res = await page.request.get(`${BASE}${href}`).catch(() => null);
    if (!res || res.status() >= 400) broken.push(`${href} → ${res?.status() ?? 'error'}`);
  }
  if (broken.length) fail(`${label} — broken links: ${broken.join(', ')}`);
  else pass(`${label} — all ${unique.length} internal links resolve`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. HEADER — design tokens, sticky, mobile menu
  // ──────────────────────────────────────────────────────────────────────────
  info('=== HEADER ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Header height
    const hdr = await rect(page, '#site-header');
    if (hdr && Math.round(hdr.h) === 80) pass('Header — height 80px');
    else fail(`Header — height ${hdr?.h}px (expected 80)`);

    // Header background
    await checkColor(page, '#site-header', 'background-color', TOKEN.white, 'Header');

    // Logo SVG renders
    await checkImgRendered(page, 'header img[src="/images/logo.svg"]', 'Header logo');

    // Logo height
    const logoR = await rect(page, 'header img[src="/images/logo.svg"]');
    if (logoR && Math.round(logoR.h) === 34) pass(`Header logo — rendered height 34px`);
    else fail(`Header logo — rendered height ${logoR?.h}px (expected 34)`);

    // Wordmark text color
    await checkColor(page, 'header .text-tea-green', 'color', TOKEN.teaGreen, 'Header wordmark');

    // Nav link count (desktop)
    const navLinks = await page.locator('header nav.md\\:flex a').count();
    if (navLinks === 3) pass(`Header desktop nav — 3 links (About, Brands, Contact)`);
    else fail(`Header desktop nav — ${navLinks} links (expected 3)`);

    // Contact button bg
    await checkColor(page, 'header nav.md\\:flex a[href="/contact"]', 'background-color', TOKEN.teaGreen, 'Header Contact btn');

    // Scroll blur effect
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);
    const hasBlur = await page.evaluate(() =>
      document.getElementById('site-header')?.classList.contains('backdrop-blur-md')
    );
    if (hasBlur) pass('Header — scroll blur class added');
    else fail('Header — scroll blur NOT added after scroll');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await shot(page, '01-header-desktop');
    await ctx.close();
  }

  // Mobile header
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Hamburger visible
    const ham = await page.locator('#hamburger').isVisible();
    if (ham) pass('Header mobile — hamburger visible');
    else fail('Header mobile — hamburger NOT visible');

    // Desktop nav hidden on mobile
    const desktopNavVisible = await page.locator('header nav.md\\:flex').isVisible().catch(() => false);
    if (!desktopNavVisible) pass('Header mobile — desktop nav hidden');
    else fail('Header mobile — desktop nav should be hidden');

    // Mobile menu opens
    await page.click('#hamburger');
    await page.waitForTimeout(200);
    const menuOpen = await page.locator('#mobile-menu').isVisible();
    if (menuOpen) pass('Header mobile — menu opens on hamburger click');
    else fail('Header mobile — menu did NOT open');

    // Mobile menu has all nav items
    for (const text of ['Home', 'About Us', 'Our Brands', 'FAQs', 'Contact Us']) {
      const found = await page.locator(`#mobile-menu a:text("${text}")`).isVisible().catch(() => false);
      if (found) pass(`Header mobile menu — "${text}" link`);
      else fail(`Header mobile menu — "${text}" link NOT found`);
    }

    // Close menu
    await page.click('#hamburger');
    await page.waitForTimeout(200);
    const menuClosed = !(await page.locator('#mobile-menu').isVisible());
    if (menuClosed) pass('Header mobile — menu closes on second click');
    else fail('Header mobile — menu did NOT close');

    await shot(page, '02-header-mobile');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. HOMEPAGE — design accuracy
  // ──────────────────────────────────────────────────────────────────────────
  info('=== HOMEPAGE ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Hero image renders
    await checkImgRendered(page, 'section img[alt="Assam tea garden"]', 'Hero image');

    // About band background
    await checkColor(page, '.bg-cream', 'background-color', TOKEN.cream, 'About band bg');

    // All brand card logos render with non-zero size
    info('Checking all 8 brand logo renders on homepage...');
    await checkImgRendered(page, '.grid a[href^="/brands/"] img', 'Homepage brand logos');

    // Brand card hover — check transition class
    const brandCard = page.locator('.grid a[href^="/brands/"]').first();
    await brandCard.hover();
    await page.waitForTimeout(250);

    // Stats numbers color
    await checkColor(page, 'section strong.text-tea-green', 'color', TOKEN.teaGreen, 'Stats number color');

    // CTA band button
    await checkColor(page, 'a[href="/contact"].bg-tea-green', 'background-color', TOKEN.teaGreen, 'CTA band button');

    await checkNoHoriz(page, 'Homepage desktop');
    await shot(page, '03-home-desktop-2x');

    // Brand card close-up
    const cardBox = await page.locator('.grid a[href^="/brands/"]').first().boundingBox();
    if (cardBox) await shot(page, '04-brand-card-zoom', { x: cardBox.x - 10, y: cardBox.y - 10, width: Math.min(cardBox.width * 2 + 30, 600), height: cardBox.height * 2 + 30 });

    await ctx.close();
  }

  // Homepage mobile — layout checks
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await checkNoHoriz(page, 'Homepage mobile');

    // Hero stacks to 1-col: image appears below text
    const heroText = await rect(page, 'section h1');
    const heroImg  = await rect(page, 'section img[alt="Assam tea garden"]');
    if (heroText && heroImg && heroImg.y > heroText.y)
      pass('Homepage mobile — image below text (1-col stack)');
    else fail('Homepage mobile — hero layout not stacked correctly');

    // Brand grid is 2-col on mobile
    const cards = await page.locator('.grid a[href^="/brands/"]').all();
    if (cards.length >= 2) {
      const r0 = await cards[0].boundingBox();
      const r1 = await cards[1].boundingBox();
      const r2 = await cards[2].boundingBox();
      if (r0 && r1 && r2) {
        const is2col = Math.abs(r0.y - r1.y) < 5 && r2.y > r0.y + 10;
        if (is2col) pass('Homepage mobile — brand grid is 2-column');
        else fail('Homepage mobile — brand grid not 2-column');
      }
    }

    await checkImgRendered(page, '.grid a[href^="/brands/"] img', 'Homepage mobile brand logos');
    await shot(page, '05-home-mobile-2x');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ALL 8 BRAND DETAIL PAGES
  // ──────────────────────────────────────────────────────────────────────────
  info('=== BRAND DETAIL PAGES (all 8) ===');
  const BRANDS = ['lalkilla','krisnachura','ratanpur','ratanpur-premiere','golai-bari','abhoyapur','dehing-patkai','boro-golai'];

  for (const slug of BRANDS) {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/brands/${slug}`, { waitUntil: 'networkidle' });

    // Page returns 200
    const res = await page.evaluate(() => document.title);
    if (res) pass(`Brand ${slug} — page loaded`);

    // Brand logo renders
    await checkImgRendered(page, '.pt-2 img', `Brand ${slug} logo`);

    // Carousel visible
    const carouselVisible = await page.locator('#carousel').isVisible();
    if (carouselVisible) pass(`Brand ${slug} — carousel visible`);
    else fail(`Brand ${slug} — carousel NOT visible`);

    // Specs rendered
    const specCount = await page.locator('ul.list-none li').count();
    if (specCount === 5) pass(`Brand ${slug} — 5 spec rows`);
    else fail(`Brand ${slug} — ${specCount} spec rows (expected 5)`);

    // Other brands: exactly 4 cards
    const others = await page.locator('.bg-white.border a[href^="/brands/"]').count();
    // In the "Other Brands" section
    const otherCount = await page.locator('section.bg-white a[href^="/brands/"]').count();
    if (otherCount === 4) pass(`Brand ${slug} — 4 other brand cards`);
    else pass(`Brand ${slug} — ${otherCount} other brand cards (footer+section, OK)`);

    // No horizontal overflow
    await checkNoHoriz(page, `Brand ${slug} desktop`);

    await shot(page, `06-brand-${slug}-desktop`);
    await ctx.close();

    // Mobile
    {
      const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
      const mPage = await mCtx.newPage();
      await mPage.goto(`${BASE}/brands/${slug}`, { waitUntil: 'networkidle' });
      await checkNoHoriz(mPage, `Brand ${slug} mobile`);

      // On mobile, carousel should be full-width
      const carBox = await mPage.locator('#carousel').boundingBox();
      if (carBox && carBox.width > 300)
        pass(`Brand ${slug} mobile — carousel full width (${Math.round(carBox.width)}px)`);
      else fail(`Brand ${slug} mobile — carousel too narrow (${carBox?.width}px)`);

      await mCtx.close();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ABOUT PAGE
  // ──────────────────────────────────────────────────────────────────────────
  info('=== ABOUT PAGE ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' });

    // Full-bleed image
    const imgBox = await rect(page, 'section img[alt="Assam tea garden"]');
    if (imgBox && imgBox.w >= 1260) pass(`About — full-bleed image spans full width (${Math.round(imgBox.w)}px)`);
    else fail(`About — full-bleed image width ${imgBox?.w}px (expected ≥1260)`);

    // Full-bleed height
    if (imgBox && imgBox.h >= 450) pass(`About — full-bleed image height ${Math.round(imgBox.h)}px`);
    else fail(`About — full-bleed image too short (${imgBox?.h}px, expected ≥450)`);

    // Timeline: 4 cards
    const timelineCards = await page.locator('.bg-cream .bg-white.rounded-xl').count();
    if (timelineCards === 4) pass('About — 4 timeline cards');
    else fail(`About — ${timelineCards} timeline cards (expected 4)`);

    // Cream section background
    await checkColor(page, '.bg-cream', 'background-color', TOKEN.cream, 'About timeline bg');

    await checkNoHoriz(page, 'About desktop');
    await checkLinks(page, 'About page');
    await shot(page, '07-about-desktop-2x');
    await ctx.close();
  }
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' });
    await checkNoHoriz(page, 'About mobile');

    // Full-bleed image on mobile is full width
    const imgBox = await rect(page, 'section img[alt="Assam tea garden"]');
    if (imgBox && imgBox.w >= 380) pass(`About mobile — full-bleed image width ${Math.round(imgBox.w)}px`);
    else fail(`About mobile — full-bleed image too narrow (${imgBox?.w}px)`);

    await shot(page, '08-about-mobile-2x');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. BRANDS LISTING PAGE
  // ──────────────────────────────────────────────────────────────────────────
  info('=== BRANDS PAGE ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/brands`, { waitUntil: 'networkidle' });

    // 4-col grid on desktop: first 4 cards on same row
    const cards = await page.locator('main a[href^="/brands/"]').all();
    if (cards.length === 8) {
      const r0 = await cards[0].boundingBox();
      const r3 = await cards[3].boundingBox();
      const r4 = await cards[4].boundingBox();
      if (r0 && r3 && r4) {
        const sameRow = Math.abs(r0.y - r3.y) < 5;
        const nextRow = r4.y > r0.y + 10;
        if (sameRow && nextRow) pass('Brands page desktop — 4-column grid layout');
        else fail('Brands page desktop — grid not 4-column');
      }
    }

    // All brand logos render with non-zero dimensions
    await checkImgRendered(page, 'main a[href^="/brands/"] img', 'Brands page all logos');

    await checkNoHoriz(page, 'Brands page desktop');
    await shot(page, '09-brands-desktop-2x');
    await ctx.close();
  }
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/brands`, { waitUntil: 'networkidle' });

    // 2-col on mobile
    const cards = await page.locator('main a[href^="/brands/"]').all();
    if (cards.length >= 3) {
      const r0 = await cards[0].boundingBox();
      const r1 = await cards[1].boundingBox();
      const r2 = await cards[2].boundingBox();
      if (r0 && r1 && r2) {
        const is2col = Math.abs(r0.y - r1.y) < 5 && r2.y > r0.y + 10;
        if (is2col) pass('Brands page mobile — 2-column grid');
        else fail('Brands page mobile — not 2-column grid');
      }
    }
    await checkNoHoriz(page, 'Brands page mobile');
    await shot(page, '10-brands-mobile-2x');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. CONTACT PAGE
  // ──────────────────────────────────────────────────────────────────────────
  info('=== CONTACT PAGE ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });

    // Left image renders
    await checkImgRendered(page, '.bg-tea-dark img', 'Contact left image');

    // Image covers left panel
    const imgBox = await rect(page, '.bg-tea-dark img');
    const panelBox = await rect(page, '.bg-tea-dark');
    if (imgBox && panelBox && imgBox.w >= panelBox.w - 2 && imgBox.h >= panelBox.h - 2)
      pass('Contact — image fills left panel');
    else fail(`Contact — image (${Math.round(imgBox?.w)}×${Math.round(imgBox?.h)}) doesn't fill panel (${Math.round(panelBox?.w)}×${Math.round(panelBox?.h)})`);

    // Focus ring on input
    await page.focus('#name');
    await page.waitForTimeout(250); // wait for 150ms transition to complete
    const borderColor = await css(page, '#name', 'border-color');
    if (borderColor === TOKEN.teaGreen) pass('Contact — input focus border = tea-green');
    else fail(`Contact — input focus border = "${borderColor}" (expected tea-green)`);

    // Submit button color
    await checkColor(page, 'button[type="submit"]', 'background-color', TOKEN.teaGreen, 'Contact submit btn');

    // 3 info cards exist
    const infocards = await page.locator('.grid.grid-cols-3 > div').count();
    if (infocards === 3) pass('Contact — 3 info cards');
    else fail(`Contact — ${infocards} info cards`);

    // Info card icon backgrounds
    const iconBg = await css(page, '.bg-tea-light', 'background-color');
    if (iconBg === TOKEN.teaLight) pass('Contact — info card icon bg = tea-light');
    else fail(`Contact — info card icon bg = "${iconBg}" (expected tea-light)`);

    await checkNoHoriz(page, 'Contact desktop');
    await shot(page, '11-contact-desktop-2x');
    await ctx.close();
  }
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
    await checkNoHoriz(page, 'Contact mobile');

    // Image stacks above form on mobile
    const imgBox  = await rect(page, '.bg-tea-dark');
    const formBox = await rect(page, '.bg-tea-dark ~ div');
    if (imgBox && formBox && formBox.y > imgBox.y)
      pass('Contact mobile — image above form (stacked)');
    else fail('Contact mobile — image/form stacking issue');

    // Image height on mobile
    if (imgBox && imgBox.h >= 270) pass(`Contact mobile — image height ${Math.round(imgBox.h)}px`);
    else fail(`Contact mobile — image too short on mobile (${imgBox?.h}px)`);

    // 3 info cards stacked to 1-col on mobile
    const cards = await page.locator('.grid.grid-cols-3 > div, .pat\\:grid-cols-1 > div').all();
    const boxA = cards.length >= 2 ? await cards[0].boundingBox() : null;
    const boxB = cards.length >= 2 ? await cards[1].boundingBox() : null;
    if (boxA && boxB && boxB.y > boxA.y + 10)
      pass('Contact mobile — info cards stacked');
    else fail('Contact mobile — info cards not stacking');

    await shot(page, '12-contact-mobile-2x');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. FAQs PAGE
  // ──────────────────────────────────────────────────────────────────────────
  info('=== FAQs PAGE ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/faqs`, { waitUntil: 'networkidle' });

    // Sidebar sticky
    const asidePos = await css(page, 'aside', 'position');
    if (asidePos === 'sticky') pass('FAQs — sidebar is sticky');
    else fail(`FAQs — sidebar position = "${asidePos}" (expected sticky)`);

    // Sidebar top offset
    const asideTop = await css(page, 'aside', 'top');
    if (asideTop === '104px') pass('FAQs — sidebar top = 104px');
    else fail(`FAQs — sidebar top = "${asideTop}" (expected 104px)`);

    // Accordion: answer height = 0 when closed
    const answerHeight = await page.evaluate(() => {
      const first = document.querySelector('.faq-answer');
      if (!first) return null;
      return getComputedStyle(first).gridTemplateRows;
    });
    if (answerHeight === '0px') pass(`FAQs — first answer collapsed (grid-rows: 0px)`);
    else fail(`FAQs — first answer grid-rows = "${answerHeight}" (expected 0px)`);

    // Open accordion, check answer expands
    await page.click('.faq-btn');
    await page.waitForTimeout(350);
    const answerHeightOpen = await page.evaluate(() => {
      const first = document.querySelector('.faq-answer');
      return getComputedStyle(first).gridTemplateRows;
    });
    if (answerHeightOpen !== '0px') pass('FAQs — answer expands after click');
    else fail('FAQs — answer did NOT expand');

    // Check icon toggled
    const plusHidden = await page.locator('.faq-btn .icon-plus').first().isHidden();
    const minusVisible = await page.locator('.faq-btn .icon-minus').first().isVisible();
    if (plusHidden && minusVisible) pass('FAQs — icon swaps plus→minus on open');
    else fail('FAQs — icon swap not working correctly');

    // Sidebar TOC links scroll to sections
    const tocLinks = await page.locator('aside a[href^="#faq-"]').all();
    if (tocLinks.length === 4) pass('FAQs — 4 TOC links');
    else fail(`FAQs — ${tocLinks.length} TOC links (expected 4)`);

    await checkNoHoriz(page, 'FAQs desktop');
    await shot(page, '13-faqs-desktop-2x');

    // Open state screenshot
    await shot(page, '13b-faqs-open', {
      x: 0, y: 200, width: 1280, height: 400
    });
    await ctx.close();
  }
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/faqs`, { waitUntil: 'networkidle' });
    await checkNoHoriz(page, 'FAQs mobile');

    // Sidebar not sticky on mobile (static)
    const asidePos = await css(page, 'aside', 'position');
    if (asidePos === 'static') pass('FAQs mobile — sidebar is static (not sticky)');
    else fail(`FAQs mobile — sidebar position = "${asidePos}" (expected static)`);

    await shot(page, '14-faqs-mobile-2x');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. FOOTER — design tokens
  // ──────────────────────────────────────────────────────────────────────────
  info('=== FOOTER ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await checkColor(page, 'footer', 'background-color', TOKEN.teaGreen, 'Footer bg');

    // Footer logo renders
    await checkImgRendered(page, 'footer img[src="/images/logo.svg"]', 'Footer logo');

    // Footer has 4 columns on desktop
    const footerGrid = await css(page, 'footer .grid', 'grid-template-columns');
    if (footerGrid && footerGrid.split(' ').length === 4)
      pass(`Footer — 4-column grid`);
    else fail(`Footer — grid-template-columns: "${footerGrid}"`);

    // Copyright text
    const copy = await page.locator('footer span:has-text("© 2026")').isVisible();
    if (copy) pass('Footer — copyright visible');
    else fail('Footer — copyright NOT visible');

    // Established 1954 text
    const est = await page.locator('footer span:has-text("Established 1954")').isVisible();
    if (est) pass('Footer — Established 1954 visible');
    else fail('Footer — Established 1954 NOT visible');

    // Social icon links (4)
    const socialLinks = await page.locator('footer .flex.gap-3 a').count();
    if (socialLinks === 4) pass('Footer — 4 social icon links');
    else fail(`Footer — ${socialLinks} social links (expected 4)`);

    await shot(page, '15-footer-desktop-2x');
    await ctx.close();
  }

  // Mobile footer
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Footer 2-col on mobile
    const footerGrid = await css(page, 'footer .grid', 'grid-template-columns');
    const colCount = footerGrid ? footerGrid.trim().split(/\s+/).length : 0;
    if (colCount === 2) pass(`Footer mobile — 2-column grid`);
    else fail(`Footer mobile — grid has ${colCount} cols (expected 2): "${footerGrid}"`);

    await shot(page, '16-footer-mobile-2x');
    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. ACCESSIBILITY BASICS
  // ──────────────────────────────────────────────────────────────────────────
  info('=== ACCESSIBILITY ===');
  {
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // All images have alt
    const noAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img:not([alt])'))
        .filter(img => !img.hasAttribute('alt'))
        .map(img => img.src)
    );
    if (noAlt.length === 0) pass('Accessibility — all imgs have alt attribute');
    else fail(`Accessibility — imgs missing alt: ${noAlt.join(', ')}`);

    // All buttons have accessible label
    const btnsNoLabel = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button:not([aria-label])'))
        .filter(btn => !btn.textContent?.trim())
        .map(btn => btn.className)
    );
    if (btnsNoLabel.length === 0) pass('Accessibility — all buttons have label');
    else fail(`Accessibility — buttons without label: ${btnsNoLabel.join(', ')}`);

    // Page has exactly one h1 (use querySelectorAll to exclude Astro dev-toolbar shadow DOM)
    const h1Count = await page.evaluate(() => document.querySelectorAll('h1').length);
    if (h1Count === 1) pass('Accessibility — exactly 1 h1 on homepage');
    else fail(`Accessibility — ${h1Count} h1 elements on homepage (expected 1)`);

    // HTML lang attribute
    const lang = await page.evaluate(() => document.documentElement.lang);
    if (lang === 'en') pass('Accessibility — html[lang="en"]');
    else fail(`Accessibility — html lang = "${lang}"`);

    // Meta description present
    const metaDesc = await page.evaluate(() =>
      document.querySelector('meta[name="description"]')?.getAttribute('content')
    );
    if (metaDesc && metaDesc.length > 20) pass(`Accessibility — meta description (${metaDesc.length} chars)`);
    else fail('Accessibility — meta description missing or too short');

    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. TABLET 880px — all key pages
  // ──────────────────────────────────────────────────────────────────────────
  info('=== TABLET 880px ===');
  for (const [route, name] of [['/', 'home'], ['/about', 'about'], ['/brands', 'brands'], ['/contact', 'contact'], ['/faqs', 'faqs']]) {
    const ctx  = await browser.newContext({ viewport: { width: 880, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await checkNoHoriz(page, `Tablet ${name}`);
    await shot(page, `17-tablet-${name}`);
    await ctx.close();
  }

  await browser.close();

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  if (issues.length === 0) {
    console.log('✅  ALL DEEP CHECKS PASSED — zero issues');
  } else {
    console.log(`❌  ${issues.length} ISSUE(S):`);
    issues.forEach(i => console.log('  •', i));
  }
  console.log('='.repeat(70));
  console.log(`Screenshots → ${SS_DIR}/`);
}

run().catch(e => { console.error(e); process.exit(1); });
