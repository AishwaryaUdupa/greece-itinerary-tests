// Dumps the real interactive structure of the pages under test (run in CI for debugging).
const { chromium } = require('@playwright/test');
const base = 'https://wanderlog.com';
const pages = [
  '/tp/88375/greece-trip-planner',
  '/guides/88375/greece-itineraries-and-travel-guides',
];
(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ name: 'desktop', width: 1280, height: 720 }, { name: 'mobile', width: 412, height: 915 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: 'en-US' });
    for (const path of pages) {
      const page = await ctx.newPage();
      console.log(`\n===== ${vp.name} ${path} =====`);
      try {
        const r = await page.goto(base + path, { waitUntil: 'load', timeout: 40000 });
        await page.waitForTimeout(3000);
        console.log('status', r && r.status(), '| title:', await page.title(), '| url:', page.url());
        const dump = await page.evaluate(() => {
          const t = (e) => (e.innerText || e.getAttribute('aria-label') || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 70);
          const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
          const pick = (sel) => [...document.querySelectorAll(sel)].filter(vis).map(t).filter(Boolean);
          return {
            h1: pick('h1'), h2: pick('h2').slice(0, 12),
            buttons: [...new Set(pick('button,[role=button],input[type=submit]'))].slice(0, 40),
            links: [...new Set(pick('a'))].slice(0, 50),
            inputs: [...document.querySelectorAll('input,select,textarea')].filter(vis).map((e) => `${e.tagName}[${e.type}] placeholder="${e.placeholder || ''}" aria="${e.getAttribute('aria-label') || ''}" name="${e.name || ''}"`).slice(0, 15),
            viewHrefs: [...document.querySelectorAll('a[href*="/view/"]')].slice(0, 5).map((a) => a.getAttribute('href') + ' => ' + t(a)),
            hrefSamples: [...document.querySelectorAll('a[href]')].slice(0, 25).map((a) => a.getAttribute('href')),
            bodyStart: document.body.innerText.trim().replace(/\s+/g, ' ').slice(0, 400),
          };
        });
        console.log(JSON.stringify(dump, null, 2));
      } catch (e) { console.log('ERR', e.message.split('\n')[0]); }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
