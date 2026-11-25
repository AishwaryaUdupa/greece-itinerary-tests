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

  /**
   * Wanderlog shows a "Choose your preferred language" modal on this page based on
   * location/device. A real visitor picks a language and carries on; so do we.
   * Optional: if it never appears, the test proceeds.
   */
  async dismissLanguagePrompt(): Promise<void> {
    const dialog = this.page.getByRole('dialog').filter({ hasText: /Choose your preferred language/i });
    try {
      await dialog.waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      return; // prompt did not appear
    }
    await dialog.getByRole('button', { name: 'English', exact: true }).first().click();
    await expect(dialog).toBeHidden();
  }

  async goto(): Promise<void> {
    await super.goto();
    await this.dismissLanguagePrompt();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toContainText(/Greece/i);
  }

  async openFirstItinerary(): Promise<void> {
    await expect(this.itineraryLinks.first()).toBeVisible();
    await this.itineraryLinks.first().click();
  }
}
