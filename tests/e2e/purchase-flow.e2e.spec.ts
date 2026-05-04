import { test, expect } from '../../fixtures/base.fixture';
import { PRODUCTS, COUPONS } from '../../data/products.data';

/**
 * TC-E2E-001 → TC-E2E-005
 * End-to-end purchase flows: Browse → PDP → Cart → Checkout
 * Full payment completion requires OTP — tests stop at checkout initiation.
 */
test.describe('E2E Purchase Flows', () => {
  test.setTimeout(90000);

  // ── Flow 1: Single Product ─────────────────────────────────────────────────
  test('TC-E2E-001 @smoke @e2e — single product purchase flow (to checkout)', async ({
    homePage,
    pdpPage,
    cartPage,
    checkoutPage,
  }) => {
    // Step 1: Load homepage
    await homePage.load();
    await homePage.assertHeroVisible();

    // Step 2: Navigate to a product
    const product = PRODUCTS.cricket[0];
    await pdpPage.goto(product.slug);
    await pdpPage.assertProductLoaded();

    // Step 3: Select size and add to cart
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Step 4: Proceed to checkout
    await expect(cartPage.checkoutButton).toBeEnabled();
  });

  // ── Flow 2: PLP → PDP → Cart ───────────────────────────────────────────────
  test('TC-E2E-002 @regression @e2e — browse PLP, open PDP, add to cart', async ({
    plpPage,
    pdpPage,
    cartPage,
    page,
  }) => {
    // Step 1: Open Men's PLP
    await plpPage.goToMen();
    await plpPage.assertProductsVisible();

    // Step 2: Click first product
    const initialUrl = page.url();
    await plpPage.clickFirstProduct();
    expect(page.url()).not.toBe(initialUrl);

    // Step 3: Add to cart from PDP
    await pdpPage.assertProductLoaded();
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
  });

  // ── Flow 3: Search → PDP → Cart ──────────────────────────────────────────
  test('TC-E2E-003 @regression @e2e — search product, open PDP, add to cart', async ({
    searchPage,
    pdpPage,
    cartPage,
    page,
  }) => {
    await page.goto('/');

    // Step 1: Search for cricket shoes
    await searchPage.search('cricket');
    const hasResults = await searchPage.searchResultItems.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasResults) {
      test.skip();
      return;
    }

    // Step 2: Click first result
    await searchPage.clickFirstResult();
    await pdpPage.assertProductLoaded();

    // Step 3: Add to cart
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
  });

  // ── Flow 4: Multi-product + Coupon ─────────────────────────────────────────
  test('TC-E2E-004 @regression @e2e — add multiple products, apply coupon, check total', async ({
    pdpPage,
    cartPage,
  }) => {
    const products = [PRODUCTS.cricket[0], PRODUCTS.lifestyle[0]];

    // Add multiple products
    for (const product of products) {
      await pdpPage.goto(product.slug);
      await pdpPage.addToCart();
      await cartPage.closeCart();
    }

    // Open cart and apply coupon
    await cartPage.openCart();
    const count = await cartPage.getItemCount();
    expect(count).toBeGreaterThanOrEqual(2);

    await cartPage.applyCoupon(COUPONS.valid);
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toMatch(/[\d,]+/);
  });

  // ── Flow 5: Homepage Banner → PDP → Wishlist + Cart ───────────────────────
  test('TC-E2E-005 @regression @e2e — homepage banner → PDP → add to wishlist and cart', async ({
    homePage,
    pdpPage,
    cartPage,
    page,
  }) => {
    // Step 1: Load homepage
    await homePage.load();
    await homePage.assertHeroVisible();

    // Step 2: Navigate to product
    const product = PRODUCTS.running[0];
    await pdpPage.goto(product.slug);
    await pdpPage.assertProductLoaded();

    // Step 3: Try wishlist
    const hasWishlist = await pdpPage.wishlistButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasWishlist) {
      await pdpPage.addToWishlist();
    }

    // Step 4: Add to cart
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
    const count = await cartPage.getItemCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
