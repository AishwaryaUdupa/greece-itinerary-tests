import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Wanderlog "Greece itineraries and travel guides" listing. */
export class GreeceGuidesPage extends BasePage {
  readonly path = '/guides/88375/greece-itineraries-and-travel-guides';

  readonly heading: Locator;
  readonly itineraryLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 }).first();
    // Links into published trips / guides
    this.itineraryLinks = page.locator('a[href*="/view/"]');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toContainText(/Greece/i);
  }

  async openFirstItinerary(): Promise<void> {
    await expect(this.itineraryLinks.first()).toBeVisible();
    await this.itineraryLinks.first().click();
  }
}
