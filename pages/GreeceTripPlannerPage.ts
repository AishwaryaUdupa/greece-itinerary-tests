import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Wanderlog "Greece Trip Planner" landing page.
 * Locators are role/text based (no CSS classes) so they survive restyling.
 */
export class GreeceTripPlannerPage extends BasePage {
  readonly path = '/tp/88375/greece-trip-planner';

  readonly heading: Locator;
  readonly startDate: Locator;
  readonly endDate: Locator;
  readonly planTripButton: Locator;
  readonly logIn: Locator;
  readonly signUp: Locator;
  readonly topDestinations: Locator;
  readonly topAttractions: Locator;
  readonly saveButtons: Locator;
  readonly createTripButton: Locator;
  readonly savedCounter: Locator;
  /** Any sign-in / sign-up prompt that interrupts an action. */
  readonly authPrompt: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /Greece Trip Planner/i }).first();
    this.startDate = page.getByText('Start date', { exact: true }).first();
    this.endDate = page.getByText('End date', { exact: true }).first();
    this.planTripButton = page.getByRole('button', { name: /^Plan trip$/i }).first();
    this.logIn = page.getByRole('link', { name: /^Log in$/i }).or(page.getByRole('button', { name: /^Log in$/i })).first();
    this.signUp = page.getByRole('link', { name: /^Sign up$/i }).or(page.getByRole('button', { name: /^Sign up$/i })).first();
    this.topDestinations = page.getByText(/Top destinations in Greece/i).first();
    this.topAttractions = page.getByText(/Top attractions in Greece/i).first();
    this.saveButtons = page.getByRole('button', { name: /^Save$/i });
    this.createTripButton = page.getByRole('button', { name: /^Create trip$/i }).first();
    this.savedCounter = page.getByText(/\d+ places? saved to your trip to Greece/i).first();
    this.authPrompt = page
      .getByRole('dialog')
      .filter({ hasText: /log in|sign up|continue with/i })
      .first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.planTripButton).toBeVisible();
  }

  /** Number currently shown in "N places saved to your trip to Greece". */
  async savedCount(): Promise<number> {
    await this.savedCounter.scrollIntoViewIfNeeded();
    const text = (await this.savedCounter.textContent()) ?? '';
    const match = text.match(/(\d+)\s+places?/i);
    return match ? Number(match[1]) : NaN;
  }

  async saveAttraction(index = 0): Promise<void> {
    const button = this.saveButtons.nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }
}
