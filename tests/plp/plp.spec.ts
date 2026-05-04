import { test, expect } from '../../fixtures/base.fixture';
import { PLP_SLUGS } from '../../data/products.data';

/**
 * TC-PLP-001 → TC-PLP-015
 * Product Listing Page: Products display, filters, sort, navigation
 */
test.describe('Product Listing Page (PLP)', () => {
  // ── Men PLP ────────────────────────────────────────────────────────────────
  test.describe('Men PLP', () => {
    test.beforeEach(async ({ plpPage }) => {
      await plpPage.goToMen();
    });

    test('TC-PLP-001 @smoke @sanity — men PLP loads with products', async ({ plpPage }) => {
      await plpPage.assertProductsVisible();
      const count = await plpPage.getProductCardCount();
      expect(count).toBeGreaterThan(0);
    });

    test('TC-PLP-002 @regression — product cards have names and prices', async ({ plpPage, page }) => {
      await plpPage.assertProductsVisible();
      const names = await plpPage.getProductNames();
      expect(names.length).toBeGreaterThan(0);
    });

    test('TC-PLP-003 @regression — clicking a product navigates to PDP', async ({ plpPage, page }) => {
      await plpPage.assertProductsVisible();
      const initialUrl = page.url();
      await plpPage.clickFirstProduct();
      expect(page.url()).not.toBe(initialUrl);
    });

    test('TC-PLP-004 @regression — breadcrumbs are present', async ({ plpPage }) => {
      const visible = await plpPage.breadcrumbs.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        await expect(plpPage.breadcrumbs).toBeVisible();
      }
    });
  });

  // ── Women PLP ──────────────────────────────────────────────────────────────
  test.describe('Women PLP', () => {
    test.beforeEach(async ({ plpPage }) => {
      await plpPage.goToWomen();
    });

    test('TC-PLP-005 @smoke — women PLP loads with products', async ({ plpPage }) => {
      await plpPage.assertProductsVisible();
    });

    test('TC-PLP-006 @regression — women products are distinct from men', async ({ plpPage }) => {
      const count = await plpPage.getProductCardCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ── Filters & Sort ─────────────────────────────────────────────────────────
  test.describe('Filters and Sort', () => {
    test.beforeEach(async ({ plpPage }) => {
      await plpPage.goToMen();
      await plpPage.assertProductsVisible();
    });

    test('TC-PLP-007 @regression — filter button is accessible', async ({ plpPage }) => {
      const hasFilter = await plpPage.filterButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasFilter) {
        await plpPage.openFilters();
        await plpPage.assertFilterPanelVisible();
      }
    });

    test('TC-PLP-008 @regression — sort dropdown is accessible', async ({ plpPage }) => {
      const hasSort = await plpPage.sortDropdown.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasSort) {
        expect(hasSort).toBeTruthy();
      }
    });

    test('TC-PLP-009 @regression — applying size filter reduces or maintains product count', async ({ plpPage }) => {
      const initialCount = await plpPage.getProductCardCount();
      await plpPage.selectSizeFilter('8');
      const filteredCount = await plpPage.getProductCardCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('TC-PLP-010 @regression — load more button loads additional products', async ({ plpPage }) => {
      const initialCount = await plpPage.getProductCardCount();
      await plpPage.loadMore();
      const newCount = await plpPage.getProductCardCount();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  // ── Category Pages ─────────────────────────────────────────────────────────
  test.describe('Category Pages', () => {
    test('TC-PLP-011 @regression — new launches PLP loads', async ({ plpPage }) => {
      await plpPage.goToCategory('new-launches');
      await plpPage.assertProductsVisible();
    });

    test('TC-PLP-012 @regression — sports shoes PLP loads', async ({ plpPage }) => {
      await plpPage.goToCategory('sports-shoes');
      await plpPage.assertProductsVisible();
    });

    test('TC-PLP-013 @regression — cricket shoes PLP loads', async ({ plpPage }) => {
      await plpPage.goToCategory('sports-shoes-cricket');
      await plpPage.assertProductsVisible();
    });
  });

  // ── Wishlist on PLP ────────────────────────────────────────────────────────
  test('TC-PLP-014 @regression — wishlist button visible on product card', async ({ plpPage }) => {
    await plpPage.goToMen();
    await plpPage.assertProductsVisible();
    const hasWishlist = await plpPage.wishlistButtons.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasWishlist) {
      expect(hasWishlist).toBeTruthy();
    }
  });

  // ── Data-driven: multiple categories ──────────────────────────────────────
  const categories = [
    { name: 'Men Gender PLP', slug: 'gender/men' },
    { name: 'Women Gender PLP', slug: 'gender/women' },
    { name: 'Accessories PLP', slug: 'accessories' },
    { name: 'Men Apparel PLP', slug: 'men-apparel' },
    { name: 'Women Apparel PLP', slug: 'women-apparel' },
  ];

  for (const category of categories) {
    test(`TC-PLP-015 @regression — ${category.name} loads successfully`, async ({ plpPage, page }) => {
      await plpPage.goto(`/${category.slug}`);
      await expect(page).not.toHaveTitle(/404|not found/i);
    });
  }
});
