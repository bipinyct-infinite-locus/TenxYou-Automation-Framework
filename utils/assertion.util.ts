import { expect, Locator, Page } from '@playwright/test';

export const AssertUtil = {
  async textContains(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text, { ignoreCase: true });
  },

  async isVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  },

  async isHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  },

  async urlContains(page: Page, path: string): Promise<void> {
    await expect(page).toHaveURL(new RegExp(path));
  },

  async titleContains(page: Page, text: string): Promise<void> {
    await expect(page).toHaveTitle(new RegExp(text, 'i'));
  },

  async countGreaterThan(locator: Locator, count: number): Promise<void> {
    const actual = await locator.count();
    expect(actual).toBeGreaterThan(count);
  },

  async countEquals(locator: Locator, count: number): Promise<void> {
    await expect(locator).toHaveCount(count);
  },

  priceFormat(text: string): void {
    expect(text).toMatch(/[₹\d,]+/);
  },
};
