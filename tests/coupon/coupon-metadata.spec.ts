/**
 * Coupon Metadata Test Suite
 *
 * CASE 1 — discount_eligible = false metadata on product/variant
 *   The frontend reads this metadata and skips the coupon for flagged items.
 *   Automation sets metadata via Saleor Admin API, verifies no discount applied,
 *   then cleans up (restores metadata) in afterEach.
 *
 * CASE 2 — excluded_products metadata on the voucher itself
 *   Voucher carries a JSON list of {productId, variantId} entries.
 *   variantId=null means the entire product is excluded.
 *   Automation sets this metadata after voucher creation.
 */

import { test, expect } from '../../fixtures/coupon.fixture';
import {
  VOUCHER_TEST_PRODUCTS,
  KNOWN_STAGING_IDS,
  DISCOUNT_CONFIGS,
  EXCLUSION_SCENARIOS,
} from '../../data/vouchers.data';
import { PriceUtil } from '../../utils/price.util';

const PRIMARY = VOUCHER_TEST_PRODUCTS.primary;
const SECONDARY = VOUCHER_TEST_PRODUCTS.secondary;

test.describe('Coupon — Metadata Exclusion Scenarios @coupon @metadata @regression @saleor @frontend', () => {

  // ── CASE 1: discount_eligible = false ─────────────────────────────────────

  test('TC-CPN-META-001 — discount_eligible=false on variant → coupon ignored', async ({
    voucherUtil, clearCache, saleorAdmin, pdpPage, cartPage,
  }) => {
    // Setup: get variant ID and mark it ineligible
    const variantId = await voucherUtil.getFirstVariantId(PRIMARY.slug);
    await voucherUtil.disableDiscountOnObject(variantId);

    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await clearCache();

    try {
      await pdpPage.goto(`/product/${PRIMARY.slug}`);
      await pdpPage.addToCart();
      await cartPage.openCart();
      const subtotalBefore = await cartPage.getSubtotalAmount();

      await cartPage.applyCoupon(voucher.code);

      // The coupon should either show an error or apply with ₹0 discount
      const errorVisible = await cartPage.couponErrorMsg
        .isVisible({ timeout: 4000 })
        .catch(() => false);
      const successVisible = await cartPage.couponSuccessMsg
        .isVisible({ timeout: 4000 })
        .catch(() => false);

      if (successVisible) {
        // If "applied" UI shown, discount must still be ₹0 for the excluded variant
        const { discount } = await cartPage.getPriceBreakdown();
        expect(
          discount,
          'discount_eligible=false on variant should result in ₹0 discount',
        ).toBe(0);
      } else {
        expect(errorVisible, 'Expected coupon error for discount_eligible=false variant').toBe(true);
      }

      // Price unchanged
      const subtotalAfter = await cartPage.getSubtotalAmount();
      PriceUtil.assertDiscount(subtotalBefore, subtotalAfter, 'subtotal-unchanged', 2);
    } finally {
      // Cleanup: restore variant eligibility
      await voucherUtil.restoreDiscountEligibility(variantId);
    }
  });

  test('TC-CPN-META-002 — discount_eligible=false on product → coupon ignored', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    // Setup: get product ID and mark entire product ineligible
    const productId = await voucherUtil.getProductId(PRIMARY.slug);
    await voucherUtil.disableDiscountOnObject(productId);

    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await clearCache();

    try {
      await pdpPage.goto(`/product/${PRIMARY.slug}`);
      await pdpPage.addToCart();
      await cartPage.openCart();
      const subtotalBefore = await cartPage.getSubtotalAmount();

      await cartPage.applyCoupon(voucher.code);

      const errorVisible = await cartPage.couponErrorMsg
        .isVisible({ timeout: 4000 })
        .catch(() => false);
      const successVisible = await cartPage.couponSuccessMsg
        .isVisible({ timeout: 4000 })
        .catch(() => false);

      if (successVisible) {
        const { discount } = await cartPage.getPriceBreakdown();
        expect(
          discount,
          'discount_eligible=false on product should result in ₹0 discount',
        ).toBe(0);
      } else {
        expect(errorVisible, 'Expected coupon error for discount_eligible=false product').toBe(true);
      }

      const subtotalAfter = await cartPage.getSubtotalAmount();
      PriceUtil.assertDiscount(subtotalBefore, subtotalAfter, 'subtotal-unchanged', 2);
    } finally {
      await voucherUtil.restoreDiscountEligibility(productId);
    }
  });

  test('TC-CPN-META-003 — eligible item + ineligible item → only eligible gets discount', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    // Mark secondary product as ineligible, primary remains eligible
    const ineligibleProductId = await voucherUtil.getProductId(SECONDARY.slug);
    await voucherUtil.disableDiscountOnObject(ineligibleProductId);

    // Voucher for all products
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await clearCache();

    try {
      // Add eligible product (primary)
      await pdpPage.goto(`/product/${PRIMARY.slug}`);
      await pdpPage.addToCart();

      // Add ineligible product (secondary)
      await pdpPage.goto(`/product/${SECONDARY.slug}`);
      await pdpPage.addToCart();

      await cartPage.openCart();

      await cartPage.applyCoupon(voucher.code);
      await cartPage.assertCouponApplied();

      const { discount } = await cartPage.getPriceBreakdown();
      // Discount should apply only to primary (₹200), not secondary
      PriceUtil.assertDiscount(200, discount, 'eligible-only-discount', 5);
    } finally {
      await voucherUtil.restoreDiscountEligibility(ineligibleProductId);
    }
  });

  // ── CASE 2: excluded_products metadata on the voucher ─────────────────────

  test('TC-CPN-META-004 — excluded variant in voucher metadata → no discount on that variant', async ({
    voucherUtil, clearCache, saleorAdmin, pdpPage, cartPage,
  }) => {
    // Create voucher and add excluded_products with specific variantId
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await voucherUtil.setExcludedProducts(voucher.id, EXCLUSION_SCENARIOS.excludeVariant);
    await clearCache();

    // Fetch the product that owns the excluded variant
    // We use the known staging product ID — navigate to it via the known slug mapping
    // For this test we use the known product: Product:195 → slug resolved via admin
    const excludedProductData = await saleorAdmin.getProductById(
      KNOWN_STAGING_IDS.excludedProduct.productId,
    );

    await pdpPage.goto(`/product/${excludedProductData.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotalBefore = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);

    const errorVisible = await cartPage.couponErrorMsg
      .isVisible({ timeout: 4000 })
      .catch(() => false);
    const successVisible = await cartPage.couponSuccessMsg
      .isVisible({ timeout: 4000 })
      .catch(() => false);

    if (successVisible) {
      const { discount } = await cartPage.getPriceBreakdown();
      expect(discount, 'Excluded variant should receive ₹0 discount').toBe(0);
    } else {
      expect(errorVisible, 'Expected coupon not applicable for excluded variant').toBe(true);
    }

    const subtotalAfter = await cartPage.getSubtotalAmount();
    PriceUtil.assertDiscount(subtotalBefore, subtotalAfter, 'excluded-variant-price-unchanged', 2);
  });

  test('TC-CPN-META-005 — excluded product (variantId=null) → no discount on entire product', async ({
    voucherUtil, clearCache, saleorAdmin, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    // variantId=null means exclude the entire product
    await voucherUtil.setExcludedProducts(voucher.id, EXCLUSION_SCENARIOS.excludeProduct);
    await clearCache();

    const excludedProductData = await saleorAdmin.getProductById(
      KNOWN_STAGING_IDS.excludedProduct.productId,
    );

    await pdpPage.goto(`/product/${excludedProductData.slug}`);
    await pdpPage.addToCart();
    await cartPage.openCart();
    const subtotalBefore = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);

    const errorVisible = await cartPage.couponErrorMsg
      .isVisible({ timeout: 4000 })
      .catch(() => false);
    const successVisible = await cartPage.couponSuccessMsg
      .isVisible({ timeout: 4000 })
      .catch(() => false);

    if (successVisible) {
      const { discount } = await cartPage.getPriceBreakdown();
      expect(discount, 'Entirely excluded product should receive ₹0 discount').toBe(0);
    } else {
      expect(errorVisible, 'Expected coupon not applicable for excluded product').toBe(true);
    }

    const subtotalAfter = await cartPage.getSubtotalAmount();
    PriceUtil.assertDiscount(subtotalBefore, subtotalAfter, 'excluded-product-price-unchanged', 2);
  });

  test('TC-CPN-META-006 — mixed cart: excluded + eligible items → eligible still gets discount', async ({
    voucherUtil, clearCache, saleorAdmin, pdpPage, cartPage,
  }) => {
    // Voucher excludes a specific variant; cart has both that variant and a different product
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await voucherUtil.setExcludedProducts(voucher.id, EXCLUSION_SCENARIOS.excludeVariant);
    await clearCache();

    // Add excluded product
    const excludedProductData = await saleorAdmin.getProductById(
      KNOWN_STAGING_IDS.excludedProduct.productId,
    );
    await pdpPage.goto(`/product/${excludedProductData.slug}`);
    await pdpPage.addToCart();

    // Add an eligible product (different from excluded)
    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();

    await cartPage.openCart();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    // Discount should apply to the eligible product only (₹200)
    const { discount } = await cartPage.getPriceBreakdown();
    expect(discount, 'Eligible product should still receive discount in mixed cart').toBeGreaterThan(0);
    PriceUtil.assertDiscount(200, discount, 'mixed-cart-eligible-discount', 5);
  });
});
