import { Page, Locator, expect } from '@playwright/test';
import { WaitUtil } from '../utils/wait.util';
import { Logger } from '../utils/logger';

export abstract class BasePage {
  protected readonly logger: Logger;

  constructor(readonly page: Page, context = 'BasePage') {
    this.logger = Logger.getInstance(context);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  // ── Header elements ───────────────────────────────────────────────────────
  get headerLogo(): Locator {
    return this.page.locator('[alt="TEN_X_YOU_LOGO"], img[src*="txy-logo"]');
  }

  get navMen(): Locator {
    return this.page.locator('header').getByRole('link', { name: /^men$/i })
      .or(this.page.locator('header').getByRole('button', { name: /^men$/i }))
      .or(this.page.locator('header a, header button, header span').filter({ hasText: /^Men$/ }))
      .first();
  }

  get navWomen(): Locator {
    return this.page.locator('header').getByRole('link', { name: /^women$/i })
      .or(this.page.locator('header').getByRole('button', { name: /^women$/i }))
      .or(this.page.locator('header a, header button, header span').filter({ hasText: /^Women$/ }))
      .first();
  }

  get navNewLaunches(): Locator {
    return this.page.locator('header a, header button').filter({ hasText: /new launches/i }).first();
  }

  get navSale(): Locator {
    return this.page.locator('header a, header button, header span').filter({ hasText: /sale/i }).first();
  }

  get searchButton(): Locator {
    // Site header is a sticky div (not <header>); scope to it to avoid hero/content area matches
    return this.page
      .locator('div[class*="sticky"][class*="top-0"] button:has(svg use[href*="search"])')
      .or(this.page.locator('[aria-label*="search" i], [data-testid="search-btn"]'))
      .first();
  }

  get cartIcon(): Locator {
    // Cart button uses SVG sprite reference "icons--cart" (no aria-label on this site)
    return this.page
      .locator('[aria-label*="cart" i], [aria-label*="bag" i], [data-testid="cart-icon"]')
      .or(this.page.locator('button:has(svg use[href*="icons--cart"])'))
      .first();
  }

  get accountIcon(): Locator {
    return this.page
      .locator('[aria-label*="account" i], [aria-label*="user" i], [data-testid="account-icon"]')
      .first();
  }

  get wishlistIcon(): Locator {
    return this.page
      .locator('[aria-label*="wishlist" i], [aria-label*="heart" i], [data-testid="wishlist-icon"]')
      .first();
  }

  get announcementBanner(): Locator {
    return this.page.locator('[class*="announcement"], [class*="banner"], [class*="marquee"]').first();
  }

  // ── Footer elements ───────────────────────────────────────────────────────
  get footer(): Locator {
    return this.page.locator('footer, [role="contentinfo"]')
      .or(this.page.locator('[class*="Footer"], [class*="footer"], [id="footer"], [id="Footer"]'))
      .or(this.page.getByText(/privacy policy/i).first())
      .first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async clickNavMen(): Promise<void> {
    await this.navMen.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async clickNavWomen(): Promise<void> {
    await this.navWomen.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async openCart(): Promise<void> {
    await this.cartIcon.click();
    await WaitUtil.sleep(500);
  }

  async openSearch(): Promise<void> {
    await this.searchButton.click();
    await WaitUtil.sleep(500);
  }

  async openWishlist(): Promise<void> {
    await this.wishlistIcon.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertPageTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  async assertURL(url: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }

  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  async assertCount(locator: Locator, count: number): Promise<void> {
    await expect(locator).toHaveCount(count);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() =>
      (window as Window).scrollTo(0, (document as Document).body.scrollHeight),
    );
    await WaitUtil.sleep(500);
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async getCartCount(): Promise<number> {
    const badge = this.page
      .locator('[data-testid="cart-count"], [class*="cart-count"], [class*="badge"]')
      .first();
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await badge.textContent();
      return parseInt(text || '0', 10) || 0;
    }
    return 0;
  }

  protected locateByText(text: string): Locator {
    return this.page.getByText(text, { exact: false }).first();
  }

  protected locateButton(name: string): Locator {
    return this.page.getByRole('button', { name, exact: false }).first();
  }
}
