import { test as base } from '@playwright/test';
import { TenxYouFixtures } from './base.fixture';
import { test as tenxBase } from './base.fixture';
import { SaleorAdminClient } from '../api/client/saleor-admin.client';
import { VoucherUtil } from '../utils/voucher.util';
import { CacheUtil } from '../utils/cache.util';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance('CouponFixture');

// ── Extended fixture types ────────────────────────────────────────────────────

export type CouponFixtures = TenxYouFixtures & {
  /** Authenticated Saleor admin client — creates token on first use per worker */
  saleorAdmin: SaleorAdminClient;

  /** High-level voucher factory with built-in tracking and cleanup */
  voucherUtil: VoucherUtil;

  /** Convenience: clear all three cache prefixes and wait for propagation */
  clearCache: () => Promise<void>;
};

// ── Extended test with coupon fixtures ────────────────────────────────────────

export const test = tenxBase.extend<CouponFixtures>({
  saleorAdmin: async ({ request }, use) => {
    const client = new SaleorAdminClient(request);
    await client.authenticate();
    await use(client);
  },

  voucherUtil: async ({ request }, use) => {
    const util = new VoucherUtil(request);
    await use(util);
    // Auto-cleanup: delete all vouchers created during the test
    await util.cleanupAll().catch((e) =>
      logger.warn(`Voucher cleanup error: ${(e as Error).message}`),
    );
  },

  clearCache: async ({ request }, use) => {
    await use(async () => {
      logger.info('Clearing frontend cache (all prefixes)');
      await CacheUtil.clearAll(request);
    });
  },
});

export { expect } from '@playwright/test';
