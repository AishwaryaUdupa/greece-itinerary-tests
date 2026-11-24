import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

// Travel planner under test. Wanderlog's Greece trip planner by default.
const BASE_URL = process.env.BASE_URL ?? 'https://wanderlog.com';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined, // be polite to a third-party site
  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    timezoneId: 'Europe/Athens',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop traveller planning at a laptop
    { name: 'desktop-chrome', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'desktop-firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
    // Traveller browsing on a phone while commuting
    { name: 'mobile-chrome', testDir: './tests/ui', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', testDir: './tests/ui', use: { ...devices['iPhone 14'] } },
    // HTTP-level availability checks for key planning pages (no browser)
    { name: 'availability', testDir: './tests/api' },
  ],
});
