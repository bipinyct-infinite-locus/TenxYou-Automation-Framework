import { Page } from '@playwright/test';

export const WaitUtil = {
  async forNetworkIdle(page: Page, timeout = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  },

  async forDOMContentLoaded(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
  },

  async forElement(page: Page, selector: string, timeout = 10000): Promise<void> {
    await page.locator(selector).waitFor({ state: 'visible', timeout });
  },

  async forElementHidden(page: Page, selector: string, timeout = 10000): Promise<void> {
    await page.locator(selector).waitFor({ state: 'hidden', timeout });
  },

  async forURL(page: Page, urlPattern: string | RegExp, timeout = 15000): Promise<void> {
    await page.waitForURL(urlPattern, { timeout });
  },

  async forAPIResponse(page: Page, urlPattern: string | RegExp, timeout = 15000): Promise<void> {
    await page.waitForResponse(urlPattern, { timeout });
  },

  async forText(page: Page, text: string, timeout = 10000): Promise<void> {
    await page.getByText(text).first().waitFor({ state: 'visible', timeout });
  },

  async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  },

  async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (i < retries - 1) await WaitUtil.sleep(delay);
      }
    }
    throw lastError;
  },
};
