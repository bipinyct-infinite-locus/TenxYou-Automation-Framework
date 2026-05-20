import { test as base } from '@playwright/test';
import { BEApiClient } from '../api/client/be-api.client';
import { STORAGE_STATE } from '../playwright.config';

type BEApis = {
  be: BEApiClient;
  /** be client pre-authenticated via tokens from auth/storageState.json */
  beAuth: BEApiClient;
};

/**
 * Extends the Playwright `test` with two BE API client fixtures:
 *
 * - `be`     → unauthenticated client (public endpoints)
 * - `beAuth` → client loaded with the GoKwik session token from storageState.json
 *
 * Usage in spec files:
 *
 *   import { test, expect } from '../../fixtures/api.fixture';
 *
 *   test('...', async ({ be }) => { ... });       // public
 *   test('...', async ({ beAuth }) => { ... });   // auth-required
 *
 * If storageState.json is missing or contains no user_token (e.g. auth-setup
 * has not been run yet), beAuth tests are skipped with an informative message.
 */
export const test = base.extend<BEApis>({
  be: async ({ request }, use) => {
    await use(new BEApiClient(request));
  },

  beAuth: async ({ request }, use, testInfo) => {
    const client = new BEApiClient(request);
    const loaded = client.setTokenFromStorageState(STORAGE_STATE);
    if (!loaded) {
      testInfo.skip(true, 'user_token not available — run the auth-setup project first (npx playwright test --project=auth-setup)');
      return;
    }
    await use(client);
    client.logout();
  },
});

export { expect } from '@playwright/test';
