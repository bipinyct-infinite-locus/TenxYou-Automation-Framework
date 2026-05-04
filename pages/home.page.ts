import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page, 'HomePage');
  }

  // ── Locators ──────────────────────────────────────────────────────────────
  get heroBanner(): Locator {
    return this.page.locator('[class*="hero"], [class*="carousel"], [class*="slider"], [class*="banner"]').first();
  }

  get heroSlides(): Locator {
    return this.page.getByRole('button', { name: /buy now/i });
  }

  get buyNowButtons(): Locator {
    return this.page.getByRole('button', { name: /buy now/i });
  }

  get newDropsSection(): Locator {
    return this.page.locator(':text("New Drops")').first();
  }

  get featuredProducts(): Locator {
    // Homepage uses hero carousel with BUY NOW buttons — no traditional product card grid
    return this.page.getByRole('button', { name: /buy now/i });
  }

  get productNames(): Locator {
    // Product names appear as headings in the hero banner sections
    return this.page.locator('h1, h2, h3').filter({ hasNotText: /privacy|terms|newsletter|subscribe/i });
  }

  get productPrices(): Locator {
    return this.page.locator('[class*="price"], [class*="Price"]');
  }

  get saleSection(): Locator {
    return this.page.locator(':text("Sale"), :text("sale")').first();
  }

  get countdownTimer(): Locator {
    return this.page.locator('[class*="countdown"], [class*="timer"]').first();
  }

  get newsletterInput(): Locator {
    return this.page.locator('input[type="email"], input[placeholder*="email" i]').first();
  }

  get footerLinks(): Locator {
    return this.page.locator('footer a');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async load(): Promise<void> {
    await this.goto('/');
    await WaitUtil.forNetworkIdle(this.page, 5000);
    // Scroll to trigger lazy-loaded product sections, then back to top
    await this.page.evaluate(() => window.scrollBy(0, 800));
    await WaitUtil.sleep(800);
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async clickFirstBuyNow(): Promise<void> {
    // Iterate to find a visible BUY NOW button (others may be in off-screen carousel slides)
    const buttons = this.buyNowButtons;
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await this.page.waitForURL(/\/product\/|\/gender\/|\/sports-shoes|\/new-launches/, { timeout: 15000 })
          .catch(() => WaitUtil.forDOMContentLoaded(this.page));
        return;
      }
    }
    // Fallback: force-click first
    await buttons.first().click({ force: true });
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async clickBuyNowByIndex(index: number): Promise<void> {
    await this.buyNowButtons.nth(index).click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async getHeroSlideCount(): Promise<number> {
    return this.heroSlides.count();
  }

  async getProductCount(): Promise<number> {
    return this.featuredProducts.count();
  }

  async subscribeNewsletter(email: string): Promise<void> {
    await this.newsletterInput.fill(email);
    await this.page.keyboard.press('Enter');
  }

  async getAllProductNames(): Promise<string[]> {
    const names = await this.productNames.allTextContents();
    return names.map((n) => n.trim()).filter(Boolean);
  }

  async clickProductByName(name: string): Promise<void> {
    await this.page.getByText(name, { exact: false }).first().click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async navigateToMen(): Promise<void> {
    await this.goto('/gender/men');
  }

  async navigateToWomen(): Promise<void> {
    await this.goto('/gender/women');
  }

  async navigateToSale(): Promise<void> {
    // Try clicking any visible sale link; fall back to direct navigation
    const saleLink = this.page.locator('a').filter({ hasText: /sale/i }).first();
    if (await saleLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saleLink.click();
      await WaitUtil.forDOMContentLoaded(this.page);
    } else {
      await this.goto('/sale');
    }
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertHeroVisible(): Promise<void> {
    await expect(this.buyNowButtons.first()).toBeVisible({ timeout: 10000 });
  }

  async assertProductsLoaded(): Promise<void> {
    await expect(this.featuredProducts.first()).toBeVisible({ timeout: 10000 });
    const count = await this.featuredProducts.count();
    expect(count).toBeGreaterThan(0);
  }

  async assertAnnouncementBannerVisible(): Promise<void> {
    await expect(this.announcementBanner).toBeVisible({ timeout: 5000 });
  }
}
