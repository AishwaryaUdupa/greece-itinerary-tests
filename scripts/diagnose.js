// Dumps modal/dialog structure on pages under test (run in CI for debugging).
const { chromium } = require('@playwright/test');
const base = 'https://wanderlog.com';
const pages = ['/guides/88375/greece-itineraries-and-travel-guides', '/tp/88375/greece-trip-planner'];
(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ name: 'desktop', width: 1280, height: 720 }, { name: 'mobile', width: 412, height: 915 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: 'en-US' });
    for (const path of pages) {
      const page = await ctx.newPage();
      console.log(`\n===== ${vp.name} ${path} =====`);
      try {
        await page.goto(base + path, { waitUntil: 'load', timeout: 40000 });
        for (const wait of [1000, 4000, 8000]) {
          await page.waitForTimeout(wait === 1000 ? 1000 : wait - (wait === 4000 ? 1000 : 4000));
          const dlg = await page.evaluate(() => [...document.querySelectorAll('[role=dialog]')].map((d) => ({
            cls: d.className,
            text: d.innerText.trim().replace(/\s+/g, ' ').slice(0, 300),
            buttons: [...d.querySelectorAll('button,[role=button],a')].map((b) => `${b.tagName}[aria="${b.getAttribute('aria-label') || ''}" cls="${(b.className || '').toString().slice(0, 40)}"] ${b.innerText.trim().slice(0, 40)}`).slice(0, 12),
          })));
          console.log(`t+${wait}ms dialogs:`, JSON.stringify(dlg, null, 1));
        }
      } catch (e) { console.log('ERR', e.message.split('\n')[0]); }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
