import { test, expect } from '../../fixtures';

/**
 * Real-world traveller journeys for planning a trip to Greece.
 * Each test reads as something a person actually does on the site.
 */

test.describe('Journey 1: "I want to start planning a trip to Greece"', () => {
  test('landing page presents the Greece planner and a way to start @smoke', async ({ plannerPage }) => {
    await plannerPage.goto();
    await plannerPage.expectTitle(/Greece/i);
    await plannerPage.expectLoaded();
  });

  test('traveller is asked when they are travelling', async ({ plannerPage }) => {
    await plannerPage.goto();
    await expect(plannerPage.startDate).toBeVisible();
    await expect(plannerPage.endDate).toBeVisible();
  });

  test('visitor can find log in and sign up before committing', async ({ plannerPage }) => {
    await plannerPage.goto();
    await expect(plannerPage.logIn).toBeVisible();
    await expect(plannerPage.signUp).toBeVisible();
  });
});

test.describe('Journey 2: "Where should I go and what should I see?"', () => {
  test.beforeEach(async ({ plannerPage }) => {
    await plannerPage.goto();
  });

  test('shows top destinations and top attractions to pick from @smoke', async ({ plannerPage }) => {
    await expect(plannerPage.topDestinations).toBeVisible();
    await expect(plannerPage.topAttractions).toBeVisible();
  });

  test('every recommendation can be saved to a shortlist', async ({ plannerPage }) => {
    await expect(plannerPage.saveButtons.first()).toBeVisible();
    expect(await plannerPage.saveButtons.count()).toBeGreaterThan(3);
  });
});

test.describe('Journey 3: "Let me shortlist places for my itinerary"', () => {
  test('saving an attraction either updates the trip counter or asks me to sign in', async ({ plannerPage }) => {
    await plannerPage.goto();
    const before = await plannerPage.savedCount();
    expect(before).toBe(0); // fresh anonymous visitor has nothing saved

    await plannerPage.saveAttraction(0);

    // Real sites differ: anonymous saves may be allowed, or gated behind sign-in.
    // Either outcome is valid; silently doing nothing is not.
    const incremented = plannerPage.page.getByText(/[1-9]\d* places? saved to your trip to Greece/i).first();
    await expect(incremented.or(plannerPage.authPrompt)).toBeVisible();
  });

  test('a trip with nothing saved still offers Create trip', async ({ plannerPage }) => {
    await plannerPage.goto();
    await plannerPage.savedCounter.scrollIntoViewIfNeeded();
    await expect(plannerPage.createTripButton).toBeVisible();
  });
});

test.describe('Journey 4: "Pick my dates and plan the trip"', () => {
  test('clicking Plan trip without dates does not dead-end the visitor', async ({ plannerPage, page }) => {
    await plannerPage.goto();
    const startUrl = page.url();
    await plannerPage.planTripButton.click();

    // Acceptable: moves into the planner, shows a sign-in prompt, or shows a date validation message.
    const validation = page.getByText(/select|choose|enter|required|dates?/i).first();
    await expect
      .poll(async () => page.url() !== startUrl || (await plannerPage.authPrompt.isVisible()) || (await validation.isVisible()), {
        message: 'Plan trip should progress, prompt sign-in, or validate dates',
        timeout: 15_000,
      })
      .toBeTruthy();
  });
});

test.describe('Journey 5: "Show me how others planned Greece"', () => {
  test('guides listing opens a real Greece itinerary @smoke', async ({ guidesPage, page }) => {
    await guidesPage.goto();
    await guidesPage.expectLoaded();
    await guidesPage.openFirstItinerary();
    await expect(page).toHaveURL(/\/view\//);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('a 7-day Greece itinerary is available to browse', async ({ page }) => {
    await page.goto('/view/tplfdvudmy/greece-guide--7-day-itinerary');
    await expect(page).toHaveTitle(/Greece/i);
    await expect(page.getByText(/day\s*1/i).first()).toBeVisible();
  });
});

test.describe('Journey 6: "I plan on my phone"', () => {
  test('planner stays usable without horizontal scrolling on small screens', async ({ plannerPage, page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only check');
    await plannerPage.goto();
    await plannerPage.expectLoaded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
