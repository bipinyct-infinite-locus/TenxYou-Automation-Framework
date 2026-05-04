import { test as base, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export const STORAGE_STATE = path.resolve(__dirname, '../auth/storageState.json');

// ── Authenticated page fixture ────────────────────────────────────────────────
export const test = base.extend<{
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}>({
  authenticatedContext: async ({ browser }, use) => {
    const stateExists = fs.existsSync(STORAGE_STATE);
    const context = await browser.newContext(
      stateExists ? { storageState: STORAGE_STATE } : {},
    );
    await use(context);
    await context.close();
  },

  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  },
});

export { expect } from '@playwright/test';
