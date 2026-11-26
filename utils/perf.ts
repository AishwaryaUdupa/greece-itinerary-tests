import { Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Performance budgets. Web-vitals ceilings follow Google's "poor" thresholds
 * (anything past these is a genuinely bad experience): TTFB 1.8s, LCP 4s, CLS 0.25.
 * Page-weight / request-count / API budgets are pragmatic ceilings for a content-heavy
 * travel site; override with env vars when you adopt your own targets.
 */
const n = (name: string, fallback: number) => Number(process.env[name] ?? fallback);

export const budgets = {
  ttfbMs: n('PERF_TTFB_MS', 1800),
  domContentLoadedMs: n('PERF_DCL_MS', 5000),
  loadMs: n('PERF_LOAD_MS', 10000),
  lcpMs: n('PERF_LCP_MS', 4000),
  cls: n('PERF_CLS', 0.25),
  maxRequests: n('PERF_MAX_REQUESTS', 250),
  maxDecodedWeightMB: n('PERF_MAX_WEIGHT_MB', 8),
  slow4gLoadMs: n('PERF_SLOW4G_LOAD_MS', 25000),
  slow4gLcpMs: n('PERF_SLOW4G_LCP_MS', 10000),
  interactionMs: n('PERF_INTERACTION_MS', 3000),
  apiMedianMs: n('PERF_API_MEDIAN_MS', 2000),
};

export type NavMetrics = {
  ttfbMs: number;
  domContentLoadedMs: number;
  loadMs: number;
  lcpMs: number;
  cls: number;
};

/** Install LCP / CLS observers before any page script runs. Call before page.goto(). */
export async function installVitalsObservers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as any;
    w.__perf = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as any;
        if (last) w.__perf.lcp = last.renderTime || last.loadTime || last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) w.__perf.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* browser without these entry types */
    }
  });
}

/** Read navigation timing + vitals after the page has loaded and settled. */
export async function readNavMetrics(page: Page): Promise<NavMetrics> {
  await page.waitForLoadState('load');
  await page.waitForTimeout(2500); // let late LCP candidates and layout shifts land
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const p = (window as any).__perf ?? { lcp: 0, cls: 0 };
    return {
      ttfbMs: Math.round(nav.responseStart),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadMs: Math.round(nav.loadEventEnd),
      lcpMs: Math.round(p.lcp),
      cls: Math.round(p.cls * 1000) / 1000,
    };
  });
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function medianMetrics(runs: NavMetrics[]): NavMetrics {
  return {
    ttfbMs: median(runs.map((r) => r.ttfbMs)),
    domContentLoadedMs: median(runs.map((r) => r.domContentLoadedMs)),
    loadMs: median(runs.map((r) => r.loadMs)),
    lcpMs: median(runs.map((r) => r.lcpMs)),
    cls: median(runs.map((r) => r.cls)),
  };
}

/** Print a metric line (visible in CI logs), attach it to the test, and append to a JSONL file. */
export function record(testInfo: TestInfo, scenario: string, metrics: Record<string, number | string>): void {
  const row = { scenario, project: testInfo.project.name, ...metrics };
  console.log(`PERF ${JSON.stringify(row)}`);
  testInfo.annotations.push({ type: 'perf', description: JSON.stringify(metrics) });
  const file = path.join('test-results', 'perf-metrics.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(row) + '\n');
}
