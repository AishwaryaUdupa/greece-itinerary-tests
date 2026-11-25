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
    // Links into published trips / guides. Each card has an image link with no text
    // and a titled text link; only the titled one is clickable, so filter on text.
    this.itineraryLinks = page.locator('a[href*="/view/"]').filter({ hasText: /\S/ });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toContainText(/Greece/i);
  }

  async openFirstItinerary(): Promise<void> {
    await expect(this.itineraryLinks.first()).toBeVisible();
    await this.itineraryLinks.first().click();
  }
}
