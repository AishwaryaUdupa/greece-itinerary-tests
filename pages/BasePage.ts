import { Page, expect } from '@playwright/test';

/** Shared behaviour for every page object. */
export abstract class BasePage {
  constructor(public readonly page: Page) {}

  /** Path relative to baseURL, e.g. '/docs/intro'. */
  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  async expectTitle(pattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveTitle(pattern);
  }

  async expectUrl(pattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}
