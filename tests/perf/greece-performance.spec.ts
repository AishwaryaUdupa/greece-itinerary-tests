import { test, expect } from '@playwright/test';
import { GreeceTripPlannerPage } from '../../pages/GreeceTripPlannerPage';
import {
  budgets,
  installVitalsObservers,
  median,
  medianMetrics,
  NavMetrics,
  readNavMetrics,
  record,
} from '../../utils/perf';

/**
 * Performance scenarios from a Greece traveller's point of view:
 * how fast the pages they land on load, how heavy they are, how they behave on
 * mobile data, and how quickly the site reacts when they act.
 * Run with a single worker (npm run test:perf) so tests don't compete for CPU/network.
 */

const pages = [
  { name: 'Greece trip planner', path: '/tp/88375/greece-trip-planner' },
  { name: 'Greece guides list', path: '/guides/88375/greece-itineraries-and-travel-guides' },
  { name: '7-day Greece itinerary', path: '/view/tplfdvudmy/greece-guide--7-day-itinerary' },
];

test.setTimeout(120_000);

test.describe('Page load budgets (median of 3 cold loads)', () => {
  for (const p of pages) {
    test(`${p.name} loads within budget @perf`, async ({ browser }, testInfo) => {
      const runs: NavMetrics[] = [];
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext({ locale: 'en-US' }); // fresh context = cold cache
        const page = await context.newPage();
        await installVitalsObservers(page);
        await page.goto(p.path, { waitUntil: 'load' });
        runs.push(await readNavMetrics(page));
        await context.close();
      }
      const m = medianMetrics(runs);
      record(testInfo, `load: ${p.name}`, { ...m, samples: runs.length });

      expect.soft(m.ttfbMs, `TTFB ${m.ttfbMs}ms`).toBeLessThanOrEqual(budgets.ttfbMs);
      expect.soft(m.domContentLoadedMs, `DOMContentLoaded ${m.domContentLoadedMs}ms`).toBeLessThanOrEqual(budgets.domContentLoadedMs);
      expect.soft(m.loadMs, `load event ${m.loadMs}ms`).toBeLessThanOrEqual(budgets.loadMs);
      expect.soft(m.lcpMs, `LCP ${m.lcpMs}ms`).toBeLessThanOrEqual(budgets.lcpMs);
      expect.soft(m.cls, `CLS ${m.cls}`).toBeLessThanOrEqual(budgets.cls);
    });
  }
});

test.describe('Page weight', () => {
  for (const p of pages) {
    test(`${p.name} stays within request-count and size budgets @perf`, async ({ page }, testInfo) => {
      const sizes: Promise<number>[] = [];
      let requests = 0;
      page.on('request', () => requests++);
      page.on('response', (res) => {
        sizes.push(res.body().then((b) => b.length).catch(() => 0));
      });
      await page.goto(p.path, { waitUntil: 'load' });
      await page.waitForTimeout(2000);
      const totalBytes = (await Promise.all(sizes)).reduce((a, b) => a + b, 0);
      const mb = Math.round((totalBytes / 1024 / 1024) * 100) / 100;
      record(testInfo, `weight: ${p.name}`, { requests, decodedMB: mb });

      expect.soft(requests, `${requests} requests`).toBeLessThanOrEqual(budgets.maxRequests);
      expect.soft(mb, `${mb} MB decoded`).toBeLessThanOrEqual(budgets.maxDecodedWeightMB);
    });
  }
});

test.describe('Traveller on mobile data', () => {
  test('Greece planner is usable on Slow 4G with a throttled phone CPU @perf', async ({ browser, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'network/CPU throttling uses the Chrome DevTools Protocol');
    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
      isMobile: true,
      hasTouch: true,
      locale: 'en-US',
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150, // ms RTT, "Slow 4G" profile
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await installVitalsObservers(page);

    await page.goto('/tp/88375/greece-trip-planner', { waitUntil: 'load', timeout: 90_000 });
    const m = await readNavMetrics(page);
    const planner = new GreeceTripPlannerPage(page);
    await expect(planner.heading).toBeVisible();
    record(testInfo, 'slow-4g: Greece trip planner', { ...m });
    await context.close();

    expect.soft(m.loadMs, `load ${m.loadMs}ms on Slow 4G`).toBeLessThanOrEqual(budgets.slow4gLoadMs);
    expect.soft(m.lcpMs, `LCP ${m.lcpMs}ms on Slow 4G`).toBeLessThanOrEqual(budgets.slow4gLcpMs);
    expect.soft(m.cls, `CLS ${m.cls}`).toBeLessThanOrEqual(budgets.cls);
  });
});

test.describe('Responsiveness', () => {
  test('saving a place gives feedback quickly (counter update or sign-in prompt) @perf', async ({ page }, testInfo) => {
    const planner = new GreeceTripPlannerPage(page);
    await planner.goto();
    await expect(planner.saveButtons.first()).toBeVisible();

    const incremented = page.getByText(/[1-9]\d* places? saved to your trip to Greece/i).first();
    const started = Date.now();
    await planner.saveAttraction(0);
    await expect(incremented.or(planner.authPrompt)).toBeVisible({ timeout: 15_000 });
    const elapsed = Date.now() - started;
    record(testInfo, 'interaction: save a place', { feedbackMs: elapsed });

    expect(elapsed, `feedback after ${elapsed}ms`).toBeLessThanOrEqual(budgets.interactionMs);
  });
});

test.describe('Server response (HTTP only)', () => {
  for (const p of pages) {
    test(`${p.name} responds fast and is compressed @perf`, async ({ request }, testInfo) => {
      const times: number[] = [];
      let encoding = '';
      for (let i = 0; i < 5; i++) {
        const started = Date.now();
        const res = await request.get(p.path);
        times.push(Date.now() - started);
        expect(res.status()).toBe(200);
        encoding = res.headers()['content-encoding'] ?? '';
      }
      const med = median(times);
      record(testInfo, `http: ${p.name}`, { medianMs: med, maxMs: Math.max(...times), encoding: encoding || 'none' });

      expect.soft(med, `median ${med}ms`).toBeLessThanOrEqual(budgets.apiMedianMs);
      expect.soft(encoding, 'content-encoding').toMatch(/gzip|br|zstd|deflate/);
    });
  }
});
