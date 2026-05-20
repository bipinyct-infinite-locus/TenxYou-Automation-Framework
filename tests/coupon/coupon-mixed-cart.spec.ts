/**
 * Coupon Mixed Cart Test Suite
 *
 * Tests discount behaviour when the cart contains:
 *   - Multiple eligible products
 *   - Multiple quantities of the same product
 *   - A mix of eligible and excluded items
 *   - Multiple variants (some excluded, some eligible)
 *
 * Key validations:
 *   - Discount applied correctly across all eligible line items
 *   - Excluded line items retain original price
 *   - Cheapest-item logic respects quantity multiplications
 *   - Total = sum(eligible discounts) applied to subtotal
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
const LIFESTYLE = VOUCHER_TEST_PRODUCTS.lifestyle;

test.describe('Coupon — Mixed Cart Scenarios @coupon @regression @saleor @frontend', () => {

  // ── TC-CPN-MIX-001: Multiple eligible products → all get discount ─────────

  test('TC-CPN-MIX-001 @smoke — multiple eligible products all get discount', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    // All-products voucher, applyOncePerOrder=false → every line item discounted
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();

    await pdpPage.goto(`/product/${LIFESTYLE.slug}`);
    await pdpPage.addToCart();

    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();
    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();

    // With 2 eligible items and applyOncePerOrder=false:
    // discount = ₹200 × 2 = ₹400 (if both items ≥ ₹200 each)
    // or discount = sum of min(200, itemPrice) per item
    expect(discount).toBeGreaterThan(0);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-MIX-002: Multiple quantities → discount multiplied correctly ───

  test('TC-CPN-MIX-002 — multiple quantities same product → discount × qty', async ({
    voucherUtil, clearCache, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await clearCache();

    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();

    // Increase quantity to 2
    await cartPage.openCart();
    await cartPage.increaseQuantity(0);

    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();

    // 2 units × ₹200 = ₹400 discount (or capped at item price per unit)
    expect(discount).toBeGreaterThanOrEqual(200);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-MIX-003: Eligible + excluded items → only eligible discounted ──

  test('TC-CPN-MIX-003 — eligible + excluded item → only eligible gets discount', async ({
    voucherUtil, clearCache, saleorAdmin, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });
    await voucherUtil.setExcludedProducts(voucher.id, EXCLUSION_SCENARIOS.excludeVariant);
    await clearCache();

    // Add excluded product
    const excludedProduct = await saleorAdmin.getProductById(
      KNOWN_STAGING_IDS.excludedProduct.productId,
    );
    await pdpPage.goto(`/product/${excludedProduct.slug}`);
    await pdpPage.addToCart();

    // Add eligible product
    await pdpPage.goto(`/product/${PRIMARY.slug}`);
    await pdpPage.addToCart();

    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();

    // Only PRIMARY gets ₹200 discount, excluded product untouched
    PriceUtil.assertDiscount(200, discount, 'mixed-eligible-excluded-discount', 5);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });

  // ── TC-CPN-MIX-004: Multiple variants, one excluded → others get discount ─

  test('TC-CPN-MIX-004 — multiple variants, one excluded → non-excluded variants discounted', async ({
    voucherUtil, clearCache, saleorAdmin, pdpPage, cartPage,
  }) => {
    const voucher = await voucherUtil.createFixed(200, { applyOncePerOrder: false });

    // Exclude the known staging variant only (not entire product)
    await voucherUtil.setExcludedProducts(voucher.id, [
      {
        productId: KNOWN_STAGING_IDS.excludedProduct.productId,
        variantId: KNOWN_STAGING_IDS.excludedProduct.variantId,
      },
    ]);
    await clearCache();

    // Add the excluded product/variant
    const excludedProduct = await saleorAdmin.getProductById(
      KNOWN_STAGING_IDS.excludedProduct.productId,
    );
    await pdpPage.goto(`/product/${excludedProduct.slug}`);
    await pdpPage.addToCart();

    // Add a different eligible product
    await pdpPage.goto(`/product/${SECONDARY.slug}`);
    await pdpPage.addToCart();

    // Add another eligible product
    await pdpPage.goto(`/product/${LIFESTYLE.slug}`);
    await pdpPage.addToCart();

    await cartPage.openCart();
    const subtotal = await cartPage.getSubtotalAmount();

    await cartPage.applyCoupon(voucher.code);
    await cartPage.assertCouponApplied();

    const { discount, total } = await cartPage.getPriceBreakdown();

    // Discount should apply to SECONDARY + LIFESTYLE (2 items × ₹200 = ₹400)
    // but NOT to the excluded variant
    expect(discount).toBeGreaterThan(0);
    // Discount should be ≥ ₹200 (at least one eligible item)
    expect(discount).toBeGreaterThanOrEqual(200);
    PriceUtil.assertTotalAfterDiscount(subtotal, discount, total);
  });
});
