/**
 * Coupon Core Test Suite
 * Covers: fixed-amount, percentage, all-products, specific-product,
 *         specific-variant, cheapest-item-only, all-eligible, min-order, min-qty
 *
 * Flow per test:
 *   1. Create voucher via Saleor Admin API
 *   2. Clear cache (3 prefixes)
 *   3. Add product to cart via UI
 *   4. Apply coupon code
 *   5. Assert discount + total
 *   6. Auto-cleanup via voucherUtil fixture
 */

import { test, expect } from '../../fixtures/coupon.fixture';
import { PRODUCTS } from '../../data/products.data';
import { VOUCHER_TEST_PRODUCTS, DISCOUNT_CONFIGS, VOUCHER_OPTIONS } from '../../data/vouchers.data';
import { PriceUtil } from '../../utils/price.util';

const PRIMARY = VOUCHER_TEST_PRODUCTS.primary;
const SECONDARY = VOUCHER_TEST_PRODUCTS.secondary;

test.describe('Coupon — Core Scenarios @coupon @regression @saleor @frontend', () => {
  // ── TC-CPN-001: Fixed ₹200 off — all products — entire order ─────────────

  test('TC-CPN-001 @smoke — fixed ₹200 off entire order', async ({
    page, voucherUtil, clearCache, pdpPage, cartPage, request,
  }) => {
    const voucher = await voucherUtil.createFixed(200, VOUCHER_OPTIONS.allProducts);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();

    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    PriceUtil.assertDiscount(200, discount, 'fixed-200-discount');
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-002: Fixed ₹200 off — cheapest item only ─────────────────────

  test('TC-CPN-002 — fixed ₹200 off cheapest item only', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, VOUCHER_OPTIONS.cheapestOnly);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    // applyOncePerOrder=true → discount ≤ 200 and ≤ subtotal
    const { discount, total } = await cartPage.getPriceBreakdown();
    expect(discount).toBeGreaterThan(0);
    expect(discount).toBeLessThanOrEqual(200);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-003: Percentage 10% off — all products ───────────────────────

  test('TC-CPN-003 — percentage 10% off all products', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createPercentage(10, VOUCHER_OPTIONS.allProducts);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    const expectedDiscount = PriceUtil.calcPercentageDiscount(subtotal, 10);
    PriceUtil.assertDiscount(expectedDiscount, discount, '10%-discount', 5);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-004: Percentage 10% off — cheapest item only ─────────────────

  test('TC-CPN-004 — percentage 10% off cheapest item only', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createPercentage(10, VOUCHER_OPTIONS.cheapestOnly);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    expect(discount).toBeGreaterThan(0);
    // cheapest=only item, so discount = 10% of subtotal
    const expectedDiscount = PriceUtil.calcPercentageDiscount(subtotal, 10);
    PriceUtil.assertDiscount(expectedDiscount, discount, '10%-cheapest', 5);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-005: Fixed ₹200 off — specific product ───────────────────────

  test('TC-CPN-005 — fixed ₹200 on specific product', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createForProductSlug(
      DISCOUNT_CONFIGS.fixed200,
      PRIMARY.slug,
    );
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    PriceUtil.assertDiscount(200, discount, 'product-specific-fixed-200');
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-006: Percentage 15% off — specific product ───────────────────

  test('TC-CPN-006 — percentage 15% on specific product', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createForProductSlug(
      DISCOUNT_CONFIGS.pct15,
      PRIMARY.slug,
    );
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    const expectedDiscount = PriceUtil.calcPercentageDiscount(subtotal, 15);
    PriceUtil.assertDiscount(expectedDiscount, discount, '15%-product-specific', 5);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-007: Fixed ₹100 off — specific variant ───────────────────────

  test('TC-CPN-007 — fixed ₹100 on specific variant', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createForFirstVariantOf(
      DISCOUNT_CONFIGS.fixed100,
      PRIMARY.slug,
    );
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    PriceUtil.assertDiscount(100, discount, 'variant-specific-fixed-100');
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-008: Percentage 20% off — specific variant ───────────────────

  test('TC-CPN-008 — percentage 20% on specific variant', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createForFirstVariantOf(
      DISCOUNT_CONFIGS.pct20,
      PRIMARY.slug,
    );
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();
    const expectedDiscount = PriceUtil.calcPercentageDiscount(subtotal, 20);
    PriceUtil.assertDiscount(expectedDiscount, discount, '20%-variant-specific', 5);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-009: Minimum order value MET → coupon applies ─────────────────

  test('TC-CPN-009 @smoke — minimum order value met → coupon applies', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    // minOrderValue=1500; cricket shoes are typically ₹2999+
    const voucher = await voucherUtil.createFixed(200, VOUCHER_OPTIONS.minOrder1500);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    // Verify cart value exceeds minimum before testing
    expect(subtotal).toBeGreaterThan(1500);

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount).toBeGreaterThan(0);
  });

  // ── TC-CPN-010: Minimum order value NOT MET → coupon rejected ────────────

  test('TC-CPN-010 — minimum order ₹99999 not met → coupon rejected', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, VOUCHER_OPTIONS.minOrderImpossible);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponError();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount).toBe(0);
  });

  // ── TC-CPN-011: Minimum quantity MET → coupon applies ────────────────────

  test('TC-CPN-011 — minimum quantity 2 met → coupon applies', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, VOUCHER_OPTIONS.minQty2);
    await clearCache();

    // Add first product
    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();

    // Add second product
    await pdpPage.goto(`/product/${SECONDARY.slug}`);
    await pdpPage.addToCart();

    await cartPage.openCart();
    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount).toBeGreaterThan(0);
  });

  // ── TC-CPN-012: Minimum quantity NOT MET → coupon rejected ───────────────

  test('TC-CPN-012 — minimum quantity 99 not met → coupon rejected', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, VOUCHER_OPTIONS.minQtyImpossible);
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponError();

    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount).toBe(0);
  });
});
