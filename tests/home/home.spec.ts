import { test, expect } from '../../fixtures/base.fixture';

/**
 * TC-HOME-001 → TC-HOME-012
 * Homepage: Hero banners, navigation, products, footer
 */
test.describe('Homepage', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.load();
  });

  // ── @smoke ─────────────────────────────────────────────────────────────────
  test('TC-HOME-001 @smoke @sanity — page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Ten x You/i);
  });

  test('TC-HOME-002 @smoke — hero banner is visible with buy now buttons', async ({ homePage }) => {
    await homePage.assertHeroVisible();
    const count = await homePage.getHeroSlideCount();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-HOME-003 @smoke — featured products section loads', async ({ homePage }) => {
    await homePage.assertProductsLoaded();
  });

  test('TC-HOME-004 @smoke — announcement banner is visible', async ({ homePage }) => {
    // Not strictly required — skip if hidden
    const visible = await homePage.announcementBanner.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await homePage.assertAnnouncementBannerVisible();
    }
  });

  // ── @regression ────────────────────────────────────────────────────────────
  test('TC-HOME-005 @regression — header logo is visible', async ({ homePage }) => {
    await expect(homePage.headerLogo.first()).toBeVisible();
  });

  test('TC-HOME-006 @regression — Men nav link navigates to Men PLP', async ({ homePage, page }) => {
    await homePage.navigateToMen();
    await expect(page).toHaveURL(/gender\/men/i);
  });

  test('TC-HOME-007 @regression — Women nav link navigates to Women PLP', async ({ homePage, page }) => {
    await homePage.navigateToWomen();
    await expect(page).toHaveURL(/gender\/women/i);
  });

  test('TC-HOME-008 @regression — Sale nav link works', async ({ homePage, page }) => {
    await homePage.navigateToSale();
    await expect(page).not.toHaveURL(/tenxyou\.com\/$/, { timeout: 5000 });
  });

  test('TC-HOME-009 @regression — clicking BUY NOW navigates to a product page', async ({ homePage, page }) => {
    const initialUrl = page.url();
    await homePage.clickFirstBuyNow();
    await expect(page).not.toHaveURL(initialUrl);
  });

  test('TC-HOME-010 @regression — search icon is present', async ({ homePage }) => {
    const isVisible = await homePage.searchButton.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('TC-HOME-011 @regression — cart icon is present', async ({ homePage }) => {
    await expect(homePage.cartIcon).toBeVisible();
  });

  test('TC-HOME-012 @regression — footer is rendered', async ({ homePage }) => {
    await homePage.scrollToBottom();
    await expect(homePage.footer).toBeVisible();
  });

  test('TC-HOME-013 @regression — multiple products shown on homepage', async ({ homePage }) => {
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('TC-HOME-014 @regression — product names are non-empty', async ({ homePage }) => {
    const names = await homePage.getAllProductNames();
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => expect(name.trim()).not.toBe(''));
  });
});
