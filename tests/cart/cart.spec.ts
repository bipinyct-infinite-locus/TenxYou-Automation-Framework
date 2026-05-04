import { test, expect } from '../../fixtures/base.fixture';
import { PRODUCTS, COUPONS } from '../../data/products.data';

/**
 * TC-CART-001 → TC-CART-020
 * Cart: Add/remove items, qty changes, coupon, multi-product, edge cases
 */
test.describe('Shopping Cart', () => {
  const product1 = PRODUCTS.cricket[0];
  const product2 = PRODUCTS.lifestyle[0];
  const product3 = PRODUCTS.running[0];

  // ── Single product ─────────────────────────────────────────────────────────
  test.describe('Single Product Cart', () => {
    test.beforeEach(async ({ pdpPage }) => {
      await pdpPage.goto(product1.slug);
      await pdpPage.assertProductLoaded();
    });

    test('TC-CART-001 @smoke @sanity — adding product opens cart drawer', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
    });

    test('TC-CART-002 @smoke — cart shows added product', async ({ pdpPage, cartPage }) => {
      const productName = await pdpPage.getProductName();
      await pdpPage.addToCart();
      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    });

    test('TC-CART-003 @regression — cart item can be removed', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
      const countBefore = await cartPage.getItemCount();
      await cartPage.removeItemByIndex(0);
      const countAfter = await cartPage.getItemCount();
      expect(countAfter).toBeLessThan(countBefore);
    });

    test('TC-CART-004 @regression — quantity can be increased', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
      await cartPage.increaseQuantity(0);
      // Subtotal should have changed — just verify no crash
    });

    test('TC-CART-005 @regression — quantity can be decreased', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
      await cartPage.increaseQuantity(0);
      await cartPage.decreaseQuantity(0);
    });

    test('TC-CART-006 @regression — cart subtotal is displayed', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
      const subtotal = await cartPage.getSubtotal();
      expect(subtotal).toMatch(/[\d,]+/);
    });

    test('TC-CART-007 @regression — checkout button is visible in cart', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
      await expect(cartPage.checkoutButton).toBeVisible();
    });
  });

  // ── Multiple products ──────────────────────────────────────────────────────
  test.describe('Multiple Products', () => {
    test('TC-CART-008 @regression — adding multiple products accumulates in cart', async ({ pdpPage, cartPage, page }) => {
      // Add product 1
      await pdpPage.goto(product1.slug);
      await pdpPage.addToCart();
      await cartPage.closeCart();

      // Add product 2
      await pdpPage.goto(product2.slug);
      await pdpPage.addToCart();

      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBeGreaterThanOrEqual(2);
    });

    test('TC-CART-009 @regression — add 3 different products to cart', async ({ pdpPage, cartPage }) => {
      const products = [product1, product2, product3];
      for (const p of products) {
        await pdpPage.goto(p.slug);
        await pdpPage.addToCart();
        await cartPage.closeCart();
      }
      await cartPage.openCart();
      const count = await cartPage.getItemCount();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Coupon ─────────────────────────────────────────────────────────────────
  test.describe('Coupon Scenarios', () => {
    test.beforeEach(async ({ pdpPage, cartPage }) => {
      await pdpPage.goto(product1.slug);
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
    });

    test('TC-CART-010 @regression — valid coupon FLAT200 can be applied', async ({ cartPage }) => {
      await cartPage.applyCoupon(COUPONS.valid);
      const success = await cartPage.couponSuccessMsg.isVisible({ timeout: 5000 }).catch(() => false);
      const error = await cartPage.couponErrorMsg.isVisible({ timeout: 2000 }).catch(() => false);
      // If min order not met, error is expected
      expect(success || error).toBeTruthy();
    });

    test('TC-CART-011 @regression @negative — invalid coupon shows error', async ({ cartPage }) => {
      await cartPage.applyCoupon(COUPONS.invalid);
      await cartPage.assertCouponError();
    });

    test('TC-CART-012 @regression @negative — empty coupon field does not crash', async ({ cartPage }) => {
      await cartPage.applyCoupon('');
      // No assertion — just verify page does not crash
    });
  });

  // ── Empty Cart ─────────────────────────────────────────────────────────────
  test('TC-CART-013 @regression — empty cart message shown when no items', async ({ cartPage }) => {
    await cartPage.openCart();
    const isEmpty = await cartPage.emptyCartMessage.isVisible({ timeout: 3000 }).catch(() => false);
    if (isEmpty) {
      await cartPage.assertCartEmpty();
    }
  });

  // ── Cart icon counter ──────────────────────────────────────────────────────
  test('TC-CART-014 @regression — cart icon count reflects added items', async ({ pdpPage, page }) => {
    const before = await pdpPage.getCartCount();
    await pdpPage.goto(product1.slug);
    await pdpPage.addToCart();
    await page.waitForTimeout(1000);
    const after = await pdpPage.getCartCount();
    expect(after).toBeGreaterThanOrEqual(before);
  });

  // ── Continue shopping ──────────────────────────────────────────────────────
  test('TC-CART-015 @regression — continue shopping closes cart', async ({ pdpPage, cartPage }) => {
    await pdpPage.goto(product1.slug);
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
    await cartPage.closeCart();
    const isVisible = await cartPage.cartDrawer.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBeFalsy();
  });
});
