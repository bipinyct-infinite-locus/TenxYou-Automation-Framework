/**
 * Coupon Negative Test Suite
 *
 * Tests all failure paths:
 *   - Invalid / non-existent coupon code
 *   - Expired coupon (endDate in the past)
 *   - Inactive/disabled coupon
 *   - Below minimum order value threshold
 *   - Empty code input
 *   - Special characters / SQL injection attempt
 *
 * All these should result in an error message and ₹0 discount.
 */

import { test, expect } from '../../fixtures/coupon.fixture';
import { VOUCHER_TEST_PRODUCTS, NEGATIVE_COUPON_CODES } from '../../data/vouchers.data';

const PRIMARY = VOUCHER_TEST_PRODUCTS.primary;

test.describe('Coupon — Negative Scenarios @coupon @negative @regression @frontend', () => {

  test.beforeEach(async ({ pdpPage, cartPage }) => {
    // Ensure a product is in the cart for every negative test
    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
  });

  // ── TC-CPN-NEG-001: Invalid / non-existent code ───────────────────────────

  test('TC-CPN-NEG-001 @smoke — invalid coupon code shows error', async ({ cartPage }) => {
    await cartPage.applyCoupon(NEGATIVE_COUPON_CODES.invalid);
    await cartPage.assertCouponError();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount, 'No discount should be applied for invalid code').toBe(0);
  });

  // ── TC-CPN-NEG-002: Expired coupon (endDate in the past) ─────────────────

  test('TC-CPN-NEG-002 — expired coupon shows error', async ({
    voucherUtil, clearCache, cartPage,
  }) => {
    // Create a voucher with endDate 1 day in the past
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const admin = await voucherUtil.getAdminClient();
    await admin.authenticate();

    // Build an expired voucher manually via the admin client
    const expiredVoucher = await admin.createVoucher(
      {
        name: '[AUTO TEST] expired',
        code: `AUTO_EXPIRED_${Date.now()}`,
        type: 'ENTIRE_ORDER',
        discountValueType: 'FIXED',
        startDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        endDate: yesterday,
      },
      { discountValue: 200 },
    );
    await admin.updateMetadata(expiredVoucher.id, { show_on_cart: 'true' });
    await clearCache();

    await cartPage.applyCoupon(expiredVoucher.code);
    await cartPage.assertCouponError();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount, 'No discount for expired coupon').toBe(0);
  });

  // ── TC-CPN-NEG-003: Inactive (disabled) coupon ───────────────────────────

  test('TC-CPN-NEG-003 — coupon with future start date not yet active → error', async ({
    voucherUtil, clearCache, cartPage,
  }) => {
    const admin = await voucherUtil.getAdminClient();
    await admin.authenticate();

    // Voucher starts 24h in the future → not yet active
    const futureDateISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const inactiveVoucher = await admin.createVoucher(
      {
        name: '[AUTO TEST] future-start',
        code: `AUTO_INACTIVE_${Date.now()}`,
        type: 'ENTIRE_ORDER',
        discountValueType: 'FIXED',
        startDate: futureDateISO,
      },
      { discountValue: 200 },
    );
    await clearCache();

    await cartPage.applyCoupon(inactiveVoucher.code);
    await cartPage.assertCouponError();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount, 'No discount for not-yet-active coupon').toBe(0);
  });

  // ── TC-CPN-NEG-004: Below minimum order value ─────────────────────────────

  test('TC-CPN-NEG-004 — coupon below minimum order value shows error', async ({
    voucherUtil, clearCache, cartPage,
  }) => {
    // minOrderValue=99999 is impossible to meet
    const voucher = await voucherUtil.createFixed(200, {
      minRequirements: { minOrderValue: 99999 },
    });
    await clearCache();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponError();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount, 'No discount when below minimum order value').toBe(0);
  });

  // ── TC-CPN-NEG-005: Empty coupon code ────────────────────────────────────

  test('TC-CPN-NEG-005 — empty coupon input → no action or graceful error', async ({
    cartPage,
  }) => {
    // Should either be a no-op (button disabled) or show an error
    await cartPage.applyCoupon(NEGATIVE_COUPON_CODES.empty);

    // Button should be disabled or error shown — at minimum, no discount applied
    const successVisible = await cartPage.couponSuccessMsg
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(successVisible, 'Empty code should not apply successfully').toBe(false);

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount).toBe(0);
  });

  // ── TC-CPN-NEG-006: Special characters in coupon code ────────────────────

  test('TC-CPN-NEG-006 — special characters in code → error, no XSS', async ({ cartPage }) => {
    await cartPage.applyCoupon(NEGATIVE_COUPON_CODES.special);
    await cartPage.assertCouponError();

    // Ensure page is not broken (title still present, cart items visible)
    await expect(cartPage.cartDrawer).toBeVisible({ timeout: 5000 });

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount).toBe(0);
  });

  // ── TC-CPN-NEG-007: Coupon for different product applied to wrong product ─

  test('TC-CPN-NEG-007 — product-specific coupon applied to wrong product → no discount', async ({
    voucherUtil, clearCache, cartPage,
  }) => {
    // Create voucher valid only for LIFESTYLE products, but cart has CRICKET (PRIMARY)
    const voucher = await voucherUtil.createForProductSlug(
      { type: 'FIXED', value: 200 },
      VOUCHER_TEST_PRODUCTS.lifestyle.slug,
    );
    await clearCache();

    // Cart already has PRIMARY (cricket) from beforeEach — no lifestyle product
    await cartPage.applyCoupon(voucher.code);

    const errorVisible = await cartPage.couponErrorMsg.isVisible({ timeout: 5000 }).catch(() => false);
    const successWithZero = await cartPage.couponSuccessMsg.isVisible({ timeout: 3000 }).catch(() => false);

    if (successWithZero) {
      const { discount } = await cartPage.getPriceBreakdown();
      expect(discount, 'Product-specific coupon should not apply to wrong product').toBe(0);
    } else {
      expect(errorVisible, 'Expected error for wrong-product coupon').toBe(true);
    }
  });
});
