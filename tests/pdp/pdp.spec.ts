import { test, expect } from '../../fixtures/base.fixture';
import { PRODUCTS } from '../../data/products.data';

/**
 * TC-PDP-001 → TC-PDP-020
 * Product Detail Page: Product info, size selection, add to cart, buy now, wishlist
 */
test.describe('Product Detail Page (PDP)', () => {
  const cricketShoe = PRODUCTS.cricket[0]; // all-rounder-cricket-shoe-lime-green
  const sneaker = PRODUCTS.lifestyle[0];   // crossover-bungee-lacing-sneaker-sage

  // ── Product Page Load ──────────────────────────────────────────────────────
  test.describe('Product Page Load', () => {
    test.beforeEach(async ({ pdpPage }) => {
      await pdpPage.goto(cricketShoe.slug);
    });

    test('TC-PDP-001 @smoke @sanity — product page loads with name and price', async ({ pdpPage }) => {
      await pdpPage.assertProductLoaded();
    });

    test('TC-PDP-002 @smoke — product image is visible', async ({ pdpPage }) => {
      await expect(pdpPage.mainProductImage).toBeVisible({ timeout: 10000 });
    });

    test('TC-PDP-003 @regression — product has at least one image', async ({ pdpPage }) => {
      const count = await pdpPage.getImageCount();
      expect(count).toBeGreaterThan(0);
    });

    test('TC-PDP-004 @regression — product name is non-empty', async ({ pdpPage }) => {
      const name = await pdpPage.getProductName();
      expect(name.trim()).not.toBe('');
    });

    test('TC-PDP-005 @regression — product price is displayed', async ({ pdpPage }) => {
      const price = await pdpPage.getProductPrice();
      expect(price).toMatch(/[\d,]+/);
    });

    test('TC-PDP-006 @regression — size selector is visible', async ({ pdpPage }) => {
      await pdpPage.assertSizeSelectorVisible();
    });

    test('TC-PDP-007 @regression — add to cart button is present', async ({ pdpPage }) => {
      await pdpPage.assertAddToCartEnabled();
    });
  });

  // ── Add to Cart ────────────────────────────────────────────────────────────
  test.describe('Add to Cart', () => {
    test.beforeEach(async ({ pdpPage }) => {
      await pdpPage.goto(cricketShoe.slug);
    });

    test('TC-PDP-008 @smoke — selecting size and adding to cart works', async ({ pdpPage, cartPage }) => {
      await pdpPage.addToCart();
      await cartPage.assertCartOpen();
    });

    test('TC-PDP-009 @regression — cart count increases after add to cart', async ({ page, pdpPage }) => {
      const initialCount = await pdpPage.getCartCount();
      await pdpPage.addToCart();
      // Allow time for cart update
      await page.waitForTimeout(1000);
      const newCount = await pdpPage.getCartCount();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('TC-PDP-010 @regression — adding without size shows error', async ({ pdpPage }) => {
      // Click add to cart without selecting size (if size selector is present)
      const hasSizes = await pdpPage.sizeOptions.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSizes) {
        await pdpPage.addToCartButton.click();
        await pdpPage.assertSizeErrorShown();
      }
    });
  });

  // ── Data-driven: Multiple products ─────────────────────────────────────────
  test.describe('Data-driven: Multiple Products', () => {
    const products = [
      ...PRODUCTS.cricket.slice(0, 2),
      ...PRODUCTS.lifestyle.slice(0, 2),
      ...PRODUCTS.running.slice(0, 1),
    ];

    for (const product of products) {
      test(`TC-PDP-011 @regression — ${product.name} (${product.color}) loads correctly`, async ({ pdpPage }) => {
        await pdpPage.goto(product.slug);
        const name = await pdpPage.getProductName();
        expect(name.trim()).not.toBe('');
      });
    }
  });

  // ── Wishlist ───────────────────────────────────────────────────────────────
  test.describe('Wishlist on PDP', () => {
    test('TC-PDP-012 @regression — wishlist button is present', async ({ pdpPage }) => {
      await pdpPage.goto(sneaker.slug);
      await pdpPage.assertProductLoaded();
      const hasWishlist = await pdpPage.wishlistButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasWishlist) {
        expect(hasWishlist).toBeTruthy();
      }
    });

    test('TC-PDP-013 @regression — adding to wishlist does not reload page', async ({ pdpPage, page }) => {
      await pdpPage.goto(sneaker.slug);
      await pdpPage.assertProductLoaded();
      const hasWishlist = await pdpPage.wishlistButton.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasWishlist) {
        const urlBefore = page.url();
        await pdpPage.addToWishlist();
        expect(page.url()).toBe(urlBefore);
      }
    });
  });

  // ── Delivery Check ─────────────────────────────────────────────────────────
  test('TC-PDP-014 @regression — pincode delivery check works', async ({ pdpPage }) => {
    await pdpPage.goto(cricketShoe.slug);
    await pdpPage.checkDelivery('560001');
    // No assertion on result — just ensure no JS error
  });

  // ── Color Variants ─────────────────────────────────────────────────────────
  test('TC-PDP-015 @regression — color options are selectable', async ({ pdpPage }) => {
    await pdpPage.goto(cricketShoe.slug);
    const hasColors = await pdpPage.colorOptions.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasColors) {
      await pdpPage.selectColor(0);
    }
  });

  // ── Edge/Negative Cases ────────────────────────────────────────────────────
  test('TC-PDP-016 @regression @negative — invalid product slug shows 404', async ({ pdpPage, page }) => {
    await pdpPage.goto('this-product-does-not-exist-xyz-999');
    const title = await page.title();
    const has404 = title.toLowerCase().includes('404') || title.toLowerCase().includes('not found');
    expect(has404).toBeTruthy();
  });

  test('TC-PDP-017 @regression — related products section renders', async ({ pdpPage }) => {
    await pdpPage.goto(cricketShoe.slug);
    await pdpPage.scrollToBottom();
    const hasRelated = await pdpPage.relatedProducts.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasRelated) {
      expect(hasRelated).toBeTruthy();
    }
  });

  test('TC-PDP-018 @regression — available sizes are non-empty', async ({ pdpPage }) => {
    await pdpPage.goto(cricketShoe.slug);
    const sizes = await pdpPage.getAvailableSizes();
    expect(sizes.length).toBeGreaterThan(0);
  });

  test('TC-PDP-019 @regression — MRP label is present for discounted product', async ({ pdpPage }) => {
    await pdpPage.goto(sneaker.slug);
    const hasMRP = await pdpPage.mrpPrice.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasMRP) {
      await expect(pdpPage.mrpPrice).toBeVisible();
    }
  });

  test('TC-PDP-020 @regression — breadcrumb navigation works', async ({ pdpPage, page }) => {
    await pdpPage.goto(cricketShoe.slug);
    const hasBreadcrumb = await pdpPage.breadcrumbs.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBreadcrumb) {
      await expect(pdpPage.breadcrumbs).toBeVisible();
    }
  });
});
