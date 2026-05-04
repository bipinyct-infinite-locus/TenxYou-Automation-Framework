import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export class PLPPage extends BasePage {
  constructor(page: Page) {
    super(page, 'PLPPage');
  }

  // ── Locators ──────────────────────────────────────────────────────────────
  get pageTitle(): Locator {
    return this.page.locator('h1, [class*="page-title"], [class*="PageTitle"]').first();
  }

  get productCards(): Locator {
    // Site uses no product-card class — product names are <p class="cursor-pointer ..."> (Tailwind)
    // No :visible — SSR pages have products in DOM even when below the fold
    return this.page.locator('[class*="product-card"], [class*="ProductCard"], [class*="product_card"]')
      .or(this.page.locator('p.cursor-pointer, p[class*="cursor-pointer"]'));
  }

  get productLinks(): Locator {
    return this.page.locator('[class*="product-card"] a, [class*="ProductCard"] a').first();
  }

  get filterButton(): Locator {
    return this.page.getByRole('button', { name: /filter/i }).first();
  }

  get sortDropdown(): Locator {
    return this.page.locator('[class*="sort"], select[name*="sort"], [aria-label*="sort" i]').first();
  }

  get filterPanel(): Locator {
    return this.page.locator('[class*="filter-panel"], [class*="FilterPanel"], [class*="filters"]');
  }

  get sizeFilters(): Locator {
    return this.page.locator('[class*="size-filter"] button, [data-filter*="size"]');
  }

  get priceFilter(): Locator {
    return this.page.locator('[class*="price-filter"], [data-filter*="price"]').first();
  }

  get colorFilters(): Locator {
    return this.page.locator('[class*="color-filter"], [data-filter*="color"]');
  }

  get clearFiltersButton(): Locator {
    return this.page.getByRole('button', { name: /clear|reset/i }).first();
  }

  get productCount(): Locator {
    return this.page.locator('[class*="product-count"], :text-matches("\\d+ product", "i")').first();
  }

  get loadMoreButton(): Locator {
    return this.page.getByRole('button', { name: /load more|show more/i }).first();
  }

  get wishlistButtons(): Locator {
    return this.page.locator('[aria-label*="wishlist" i], [class*="wishlist-btn"]');
  }

  get outOfStockBadges(): Locator {
    return this.page.locator(':text("Out of Stock"), [class*="out-of-stock"]');
  }

  get saleBadges(): Locator {
    return this.page.locator('[class*="badge"]:text("SALE"), [class*="discount-badge"]');
  }

  get breadcrumbs(): Locator {
    return this.page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb" i]').first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async goToMen(): Promise<void> {
    await this.goto('/gender/men');
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async goToWomen(): Promise<void> {
    await this.goto('/gender/women');
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async goToCategory(slug: string): Promise<void> {
    await this.goto(`/${slug}`);
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async getProductCardCount(): Promise<number> {
    await WaitUtil.forElement(this.page, '[class*="product-card"], [class*="ProductCard"]', 10000).catch(() => {});
    return this.productCards.count();
  }

  async clickFirstProduct(): Promise<void> {
    const startUrl = this.page.url();

    // Scroll to product grid AFTER initialUrl is captured by the caller
    await this.page.evaluate(() => window.scrollBy(0, 800));
    await WaitUtil.sleep(300);

    // dispatchEvent bypasses all actionability/viewport checks — works for clipped carousel items
    const tryDispatch = async (locator: import('@playwright/test').Locator): Promise<boolean> => {
      if (await locator.count() === 0) return false;
      // Short timeout so we don't stall 15s if element becomes detached after count()
      const fired = await locator.dispatchEvent('click', {}, { timeout: 5000 }).then(() => true).catch(() => false);
      if (!fired) return false;
      return this.page
        .waitForURL(u => u.href !== startUrl, { timeout: 3000 })
        .then(() => true)
        .catch(() => false);
    };

    // 1. Product name paragraph
    if (await tryDispatch(this.page.locator('p.cursor-pointer, p[class*="cursor-pointer"]').first())) {
      await WaitUtil.forDOMContentLoaded(this.page);
      await this.dismissLaunchPage();
      return;
    }

    // 2. Image wrapper div with product img (no BUY NOW button)
    if (await tryDispatch(
      this.page.locator('div.cursor-pointer')
        .filter({ has: this.page.locator('img[alt]:not([alt=""])') })
        .filter({ hasNot: this.page.locator('button', { hasText: /buy now/i }) })
        .first(),
    )) {
      await WaitUtil.forDOMContentLoaded(this.page);
      await this.dismissLaunchPage();
      return;
    }

    // 3. BUY NOW button (hero carousel)
    if (await tryDispatch(this.page.getByRole('button', { name: /buy now/i }).first())) {
      await WaitUtil.forDOMContentLoaded(this.page);
      await this.dismissLaunchPage();
      return;
    }

    await WaitUtil.forDOMContentLoaded(this.page);
    await this.dismissLaunchPage();
  }

  // Some products have a campaign "launch page" overlay — dismiss it to reach the standard PDP
  private async dismissLaunchPage(): Promise<void> {
    const closeLaunch = this.page.getByRole('link', { name: /close launch page/i });
    if (await closeLaunch.count() === 0) return;
    await closeLaunch.click();
    // Client-side re-render after dismissing the launch overlay — wait for price/ATC to appear
    await this.page.waitForSelector('[class*="price"], [class*="Price"]', { timeout: 8000 }).catch(() => {});
  }

  async clickProductByIndex(index: number): Promise<void> {
    await this.productCards.nth(index).click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async getProductNames(): Promise<string[]> {
    const cards = await this.productCards.all();
    const names: string[] = [];
    for (const card of cards) {
      const text = await card.textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  async openFilters(): Promise<void> {
    if (await this.filterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.filterButton.click();
      await WaitUtil.sleep(500);
    }
  }

  async selectSizeFilter(size: string): Promise<void> {
    await this.openFilters();
    await this.page.getByText(size, { exact: true }).first().click();
    await WaitUtil.sleep(500);
  }

  async sortBy(option: string): Promise<void> {
    if (await this.sortDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.sortDropdown.click();
      await this.page.getByText(option, { exact: false }).first().click();
      await WaitUtil.sleep(1000);
    }
  }

  async addToWishlistByIndex(index: number): Promise<void> {
    await this.wishlistButtons.nth(index).click();
    await WaitUtil.sleep(500);
  }

  async loadMore(): Promise<void> {
    if (await this.loadMoreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.loadMoreButton.click();
      await WaitUtil.forNetworkIdle(this.page);
    }
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertProductsVisible(): Promise<void> {
    // SSR page: products are in DOM immediately after domcontentloaded (even if below fold)
    // Use toBeAttached to avoid scrolling that can trigger client-side URL changes
    await expect(this.productCards.first()).toBeAttached({ timeout: 15000 });
  }

  async assertProductCountGreaterThan(count: number): Promise<void> {
    const actual = await this.getProductCardCount();
    expect(actual).toBeGreaterThan(count);
  }

  async assertFilterPanelVisible(): Promise<void> {
    await expect(this.filterPanel).toBeVisible({ timeout: 5000 });
  }
}
