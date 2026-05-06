/**
 * PureAssamTea — comprehensive QA script
 * Checks every page at desktop + mobile, all interactions, images, links, console errors.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:4322';
const SS_DIR = '/tmp/pat-screenshots';
mkdirSync(SS_DIR, { recursive: true });

const DESKTOP = { width: 1280, height: 900 };
const MOBILE  = { width: 390,  height: 844 };   // iPhone 14 size

const issues = [];
function log(tag, msg) {
  const entry = `[${tag}] ${msg}`;
  console.log(entry);
  if (tag === 'FAIL') issues.push(entry);
}
const pass = msg => log('PASS', msg);
const fail = msg => log('FAIL', msg);
const info = msg => log('INFO', msg);

async function shot(page, name) {
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
  info(`screenshot: ${name}.png`);
}

async function checkNoConsoleErrors(page, label) {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  return () => {
    if (errors.length) fail(`${label} — console errors: ${errors.join(' | ')}`);
    else pass(`${label} — no console errors`);
  };
}

async function checkImages(page, label) {
  const broken = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src);
  });
  if (broken.length) fail(`${label} — broken images: ${broken.join(', ')}`);
  else pass(`${label} — all images loaded`);
}

async function checkNoHorizScroll(page, label) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  if (overflow) fail(`${label} — horizontal scroll overflow`);
  else pass(`${label} — no horizontal scroll`);
}

async function checkVisible(page, selector, label) {
  try {
    const el = await page.locator(selector).first();
    const vis = await el.isVisible();
    if (vis) pass(`${label} — visible`);
    else fail(`${label} — NOT visible`);
  } catch (e) {
    fail(`${label} — not found: ${e.message}`);
  }
}

async function checkText(page, text, label) {
  const found = await page.locator(`text=${text}`).first().isVisible().catch(() => false);
  if (found) pass(`${label} — text "${text}" present`);
  else fail(`${label} — text "${text}" NOT found`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ─────────────────────────────────────────────
  // HOMEPAGE — DESKTOP
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Home desktop');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await shot(page, '01-home-desktop');

    // Nav
    await checkVisible(page, 'header', 'Home desktop — header');
    await checkVisible(page, 'a[href="/about"]', 'Home desktop — About Us nav link');
    await checkVisible(page, 'a[href="/brands"]', 'Home desktop — Our Brands nav link');
    await checkVisible(page, 'a[href="/contact"]', 'Home desktop — Contact Us nav button');

    // Hero content
    await checkText(page, 'Established 1954', 'Home desktop — hero eyebrow');
    await checkText(page, 'Upper Assam', 'Home desktop — hero h1');
    await checkText(page, 'Explore Our Brands', 'Home desktop — hero CTA');
    await checkText(page, 'Wholesale Enquiry', 'Home desktop — hero ghost CTA');
    await checkText(page, '2.7M', 'Home desktop — stats 2.7M');
    await checkText(page, '1954', 'Home desktop — stats 1954');
    await checkText(page, '70+', 'Home desktop — hero badge');

    // About band
    await checkText(page, 'A family business', 'Home desktop — about band h2');
    await checkText(page, 'Read More', 'Home desktop — about band CTA');

    // Brands grid
    await checkText(page, 'Eight names', 'Home desktop — brands section h2');
    await checkText(page, 'Lalkilla', 'Home desktop — Lalkilla card');
    await checkText(page, 'Krisnachura', 'Home desktop — Krisnachura card');
    await checkText(page, 'Abhoyapur', 'Home desktop — Abhoyapur card');
    const brandCards = await page.locator('a[href^="/brands/"]').count();
    if (brandCards >= 8) pass(`Home desktop — ${brandCards} brand card links`);
    else fail(`Home desktop — only ${brandCards} brand card links (expected 8+)`);

    // CTA band
    await checkText(page, 'Interested in buying', 'Home desktop — CTA band');
    await checkText(page, 'Get in Touch', 'Home desktop — CTA band button');

    // Footer
    await checkText(page, 'Goenka Family Group', 'Home desktop — footer copyright');
    await checkText(page, 'Contact', 'Home desktop — footer contact column');

    await checkImages(page, 'Home desktop');
    await checkNoHorizScroll(page, 'Home desktop');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // HOMEPAGE — MOBILE
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Home mobile');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await shot(page, '02-home-mobile');

    await checkNoHorizScroll(page, 'Home mobile');

    // Hamburger visible, desktop nav hidden
    const hamburger = page.locator('#hamburger');
    const hamVisible = await hamburger.isVisible().catch(() => false);
    if (hamVisible) pass('Home mobile — hamburger visible');
    else fail('Home mobile — hamburger NOT visible');

    // Open hamburger
    if (hamVisible) {
      await hamburger.click();
      await page.waitForTimeout(300);
      await shot(page, '02b-home-mobile-menu-open');
      const menuVisible = await page.locator('#mobile-menu').isVisible().catch(() => false);
      if (menuVisible) pass('Home mobile — mobile menu opens');
      else fail('Home mobile — mobile menu did NOT open');
      // Close it
      await hamburger.click();
      await page.waitForTimeout(200);
    }

    // Hero content present on mobile
    await checkText(page, 'Explore Our Brands', 'Home mobile — hero CTA');
    await checkText(page, '2.7M', 'Home mobile — stats row');

    await checkImages(page, 'Home mobile');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // ABOUT PAGE
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'About desktop');
    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' });
    await shot(page, '03-about-desktop');

    await checkText(page, 'Family-owned, four generations', 'About — h1');
    await checkText(page, 'Late Khetsi Das Agarwalla', 'About — founder name');
    await checkText(page, 'Sandeep Goenka', 'About — current head');
    await checkText(page, '1954 — Today', 'About — heritage label');
    await checkText(page, 'Four generations of stewardship', 'About — timeline heading');
    await checkText(page, 'Ready to source from us', 'About — CTA');
    await checkImages(page, 'About desktop');
    await checkNoHorizScroll(page, 'About desktop');
    reportErrors();
    await ctx.close();
  }

  {
    const ctx  = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'About mobile');
    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' });
    await shot(page, '04-about-mobile');
    await checkNoHorizScroll(page, 'About mobile');
    await checkImages(page, 'About mobile');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // BRANDS PAGE
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Brands desktop');
    await page.goto(`${BASE}/brands`, { waitUntil: 'networkidle' });
    await shot(page, '05-brands-desktop');

    await checkText(page, 'Eight wholesale brands', 'Brands — h1');
    const cards = await page.locator('main a[href^="/brands/"]').count();
    if (cards === 8) pass(`Brands — 8 brand cards`);
    else fail(`Brands — ${cards} brand cards (expected 8)`);

    for (const name of ['Lalkilla','Krisnachura','Ratanpur','Golai-bari','Abhoyapur','Dehing-patkai','Boro-golai']) {
      await checkText(page, name, `Brands — "${name}" card`);
    }
    await checkImages(page, 'Brands desktop');
    await checkNoHorizScroll(page, 'Brands desktop');
    reportErrors();
    await ctx.close();
  }

  {
    const ctx  = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Brands mobile');
    await page.goto(`${BASE}/brands`, { waitUntil: 'networkidle' });
    await shot(page, '06-brands-mobile');
    await checkNoHorizScroll(page, 'Brands mobile');
    await checkImages(page, 'Brands mobile');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // BRAND DETAIL — test Lalkilla + one more
  // ─────────────────────────────────────────────
  for (const slug of ['lalkilla', 'ratanpur-premiere']) {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, `Brand ${slug} desktop`);
    await page.goto(`${BASE}/brands/${slug}`, { waitUntil: 'networkidle' });
    await shot(page, `07-brand-${slug}-desktop`);

    // Breadcrumb
    await checkText(page, 'Our Brands', `Brand ${slug} — breadcrumb`);

    // Carousel present
    await checkVisible(page, '#carousel', `Brand ${slug} — carousel`);
    await checkVisible(page, '#prev-btn', `Brand ${slug} — prev btn`);
    await checkVisible(page, '#next-btn', `Brand ${slug} — next btn`);

    // Carousel navigation
    await page.click('#next-btn');
    await page.waitForTimeout(700);
    const dotsAfterNext = await page.locator('.carousel-dot.w-6').count();
    if (dotsAfterNext === 1) pass(`Brand ${slug} — carousel next works (dot moved)`);
    else fail(`Brand ${slug} — carousel next may not have worked`);

    await page.click('#prev-btn');
    await page.waitForTimeout(700);

    // Specs
    await checkText(page, 'Product Specifications', `Brand ${slug} — specs heading`);
    await checkText(page, 'CTC (Cut, Tear, Curl)', `Brand ${slug} — CTC spec`);
    await checkText(page, '25 Kg', `Brand ${slug} — packaging spec`);
    await checkText(page, 'Interested in Buying', `Brand ${slug} — CTA block`);

    // Other brands section
    const otherBrands = await page.locator('text=Other Brands').isVisible().catch(() => false);
    if (otherBrands) pass(`Brand ${slug} — other brands section`);
    else fail(`Brand ${slug} — other brands section NOT visible`);

    // Contact Us button links to /contact
    const ctaHref = await page.locator('.bg-ink.text-white[href="/contact"]').first().getAttribute('href').catch(() => null);
    if (ctaHref === '/contact') pass(`Brand ${slug} — CTA links to /contact`);
    else fail(`Brand ${slug} — CTA href = ${ctaHref}`);

    await checkImages(page, `Brand ${slug} desktop`);
    await checkNoHorizScroll(page, `Brand ${slug} desktop`);
    reportErrors();
    await ctx.close();
  }

  // Brand detail mobile
  {
    const ctx  = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Brand lalkilla mobile');
    await page.goto(`${BASE}/brands/lalkilla`, { waitUntil: 'networkidle' });
    await shot(page, '08-brand-lalkilla-mobile');
    await checkNoHorizScroll(page, 'Brand lalkilla mobile');
    await checkVisible(page, '#carousel', 'Brand lalkilla mobile — carousel');
    await checkImages(page, 'Brand lalkilla mobile');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // CONTACT PAGE
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Contact desktop');
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
    await shot(page, '09-contact-desktop');

    await checkText(page, 'Contact Us', 'Contact — h1');
    await checkText(page, 'Drop Us a Line', 'Contact — form heading');

    // Form fields present
    for (const id of ['name','phone','email','organization','city','state']) {
      const exists = await page.locator(`#${id}`).count();
      if (exists) pass(`Contact — field #${id} present`);
      else fail(`Contact — field #${id} MISSING`);
    }

    // Brand checkboxes
    const checkboxes = await page.locator('input[type="checkbox"][name="brands"]').count();
    if (checkboxes === 8) pass(`Contact — 8 brand checkboxes`);
    else fail(`Contact — ${checkboxes} brand checkboxes (expected 8)`);

    // Buyer type radios
    const radios = await page.locator('input[type="radio"][name="buyerType"]').count();
    if (radios === 5) pass(`Contact — 5 buyer type radios`);
    else fail(`Contact — ${radios} buyer type radios (expected 5)`);

    // Contact info cards
    await checkText(page, 'Goenka House', 'Contact — office card');
    await checkText(page, 'contact@pureassamtea.com', 'Contact — email card');
    await checkText(page, '2300413', 'Contact — phone card');

    // Interaction: fill a field
    await page.fill('#name', 'Test User');
    const nameVal = await page.inputValue('#name');
    if (nameVal === 'Test User') pass('Contact — form input accepts text');
    else fail('Contact — form input broken');

    await checkImages(page, 'Contact desktop');
    await checkNoHorizScroll(page, 'Contact desktop');
    reportErrors();
    await ctx.close();
  }

  {
    const ctx  = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Contact mobile');
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
    await shot(page, '10-contact-mobile');
    await checkNoHorizScroll(page, 'Contact mobile');
    await checkVisible(page, '#name', 'Contact mobile — name field visible');
    await checkImages(page, 'Contact mobile');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // FAQs PAGE
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'FAQs desktop');
    await page.goto(`${BASE}/faqs`, { waitUntil: 'networkidle' });
    await shot(page, '11-faqs-desktop');

    await checkText(page, 'Answers for buyers', 'FAQs — h1');
    await checkText(page, 'Ordering & Enquiries', 'FAQs — first group');
    await checkText(page, 'Packaging', 'FAQs — packaging group');
    await checkText(page, 'Quality & Product', 'FAQs — quality group');

    // Accordion: first item closed, click to open
    const firstBtn = page.locator('.faq-btn').first();
    const ariaBeforeClick = await firstBtn.getAttribute('aria-expanded');
    if (ariaBeforeClick === 'false') pass('FAQs — first item starts closed');
    else fail(`FAQs — first item aria-expanded = ${ariaBeforeClick} (expected false)`);

    await firstBtn.click();
    await page.waitForTimeout(300);
    await shot(page, '11b-faqs-first-open');

    const ariaAfterClick = await firstBtn.getAttribute('aria-expanded');
    if (ariaAfterClick === 'true') pass('FAQs — accordion opens on click');
    else fail(`FAQs — accordion aria-expanded = ${ariaAfterClick} after click`);

    // Click again to close
    await firstBtn.click();
    await page.waitForTimeout(300);
    const ariaAfterClose = await firstBtn.getAttribute('aria-expanded');
    if (ariaAfterClose === 'false') pass('FAQs — accordion closes on second click');
    else fail(`FAQs — accordion did not close`);

    // Sidebar TOC links
    const tocLinks = await page.locator('aside a[href^="#faq-"]').count();
    if (tocLinks === 4) pass(`FAQs — ${tocLinks} TOC anchor links`);
    else fail(`FAQs — ${tocLinks} TOC anchor links (expected 4)`);

    // "Contact our team" button
    const contactBtn = await page.locator('aside a[href="/contact"]').isVisible().catch(() => false);
    if (contactBtn) pass('FAQs — sidebar contact button');
    else fail('FAQs — sidebar contact button NOT found');

    await checkImages(page, 'FAQs desktop');
    await checkNoHorizScroll(page, 'FAQs desktop');
    reportErrors();
    await ctx.close();
  }

  {
    const ctx  = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'FAQs mobile');
    await page.goto(`${BASE}/faqs`, { waitUntil: 'networkidle' });
    await shot(page, '12-faqs-mobile');
    await checkNoHorizScroll(page, 'FAQs mobile');

    // Accordion works on mobile
    const firstBtn = page.locator('.faq-btn').first();
    await firstBtn.click();
    await page.waitForTimeout(300);
    const aria = await firstBtn.getAttribute('aria-expanded');
    if (aria === 'true') pass('FAQs mobile — accordion opens');
    else fail('FAQs mobile — accordion did not open');

    await checkImages(page, 'FAQs mobile');
    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // NAV LINKS — verify all href targets 404-free
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const routes = ['/', '/about', '/brands', '/brands/lalkilla', '/brands/krisnachura',
      '/brands/ratanpur', '/brands/ratanpur-premiere', '/brands/golai-bari',
      '/brands/abhoyapur', '/brands/dehing-patkai', '/brands/boro-golai',
      '/contact', '/faqs'];
    for (const route of routes) {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      if (res && res.status() === 200) pass(`Route ${route} — 200 OK`);
      else fail(`Route ${route} — status ${res?.status()}`);
    }
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // NAV SCROLL EFFECT
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Nav scroll effect');
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(200);
    const hasBlur = await page.evaluate(() =>
      document.getElementById('site-header')?.classList.contains('backdrop-blur-md')
    );
    if (hasBlur) pass('Nav scroll — backdrop-blur-md added on scroll');
    else fail('Nav scroll — backdrop-blur-md NOT added after scroll');

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const blurRemoved = await page.evaluate(() =>
      !document.getElementById('site-header')?.classList.contains('backdrop-blur-md')
    );
    if (blurRemoved) pass('Nav scroll — blur removed on scroll to top');
    else fail('Nav scroll — blur not removed on scroll to top');

    reportErrors();
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // FOOTER LINKS
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const footerLinks = await page.locator('footer a[href^="/"]').all();
    const linkMap = new Map();
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      if (href) linkMap.set(href, true);
    }
    if (linkMap.size >= 6) pass(`Footer — ${linkMap.size} internal links`);
    else fail(`Footer — only ${linkMap.size} internal links`);
    await ctx.close();
  }

  // ─────────────────────────────────────────────
  // TABLET SIZE CHECK (880px boundary)
  // ─────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 880, height: 900 } });
    const page = await ctx.newPage();
    const reportErrors = await checkNoConsoleErrors(page, 'Tablet 880px');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await shot(page, '13-home-tablet-880');
    await checkNoHorizScroll(page, 'Tablet 880px home');

    await page.goto(`${BASE}/brands/lalkilla`, { waitUntil: 'networkidle' });
    await shot(page, '14-brand-tablet-880');
    await checkNoHorizScroll(page, 'Tablet 880px brand detail');

    reportErrors();
    await ctx.close();
  }

  await browser.close();

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  if (issues.length === 0) {
    console.log('✅ ALL CHECKS PASSED');
  } else {
    console.log(`❌ ${issues.length} ISSUE(S) FOUND:`);
    issues.forEach(i => console.log(' •', i));
  }
  console.log('='.repeat(60));
  console.log(`Screenshots saved to ${SS_DIR}/`);
}

run().catch(e => { console.error(e); process.exit(1); });
