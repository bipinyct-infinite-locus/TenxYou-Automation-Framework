import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export class WishlistPage extends BasePage {
  constructor(page: Page) {
    super(page, 'WishlistPage');
  }

  get wishlistContainer(): Locator {
    return this.page.locator('[class*="wishlist"], [class*="Wishlist"]').first();
  }

  get wishlistItems(): Locator {
    return this.page.locator('[class*="wishlist-item"], [class*="WishlistItem"]');
  }

  get wishlistItemNames(): Locator {
    return this.page.locator('[class*="wishlist-item"] [class*="name"], [class*="wishlist-item"] h2, [class*="wishlist-item"] h3');
  }

  get removeFromWishlistButtons(): Locator {
    return this.page.locator('[class*="wishlist"] [aria-label*="remove" i], [class*="wishlist"] [class*="remove"]');
  }

  get emptyWishlistMessage(): Locator {
    return this.page.locator(':text("wishlist is empty"), :text("No items in wishlist"), [class*="empty-wishlist"]').first();
  }

  get addToCartFromWishlistButtons(): Locator {
    return this.page.locator('[class*="wishlist-item"] button:has-text("Add to Cart")');
  }

  get wishlistCount(): Locator {
    return this.page.locator('[class*="wishlist-count"], [data-testid="wishlist-count"]').first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async open(): Promise<void> {
    await this.openWishlist();
  }

  async getItemCount(): Promise<number> {
    return this.wishlistItems.count();
  }

  async getItemNames(): Promise<string[]> {
    return this.wishlistItemNames.allTextContents();
  }

  async removeItemByIndex(index = 0): Promise<void> {
    await this.removeFromWishlistButtons.nth(index).click();
    await WaitUtil.sleep(500);
  }

  async addItemToCartFromWishlist(index = 0): Promise<void> {
    await this.addToCartFromWishlistButtons.nth(index).click();
    await WaitUtil.sleep(500);
  }

  async clearWishlist(): Promise<void> {
    const count = await this.wishlistItems.count();
    for (let i = 0; i < count; i++) {
      await this.removeItemByIndex(0);
    }
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertItemInWishlist(productName: string): Promise<void> {
    const names = await this.getItemNames();
    const found = names.some((n) => n.toLowerCase().includes(productName.toLowerCase()));
    expect(found, `"${productName}" not found in wishlist`).toBeTruthy();
  }

  async assertWishlistEmpty(): Promise<void> {
    await expect(this.emptyWishlistMessage).toBeVisible({ timeout: 5000 });
  }

  async assertItemCount(count: number): Promise<void> {
    const actual = await this.getItemCount();
    expect(actual).toBe(count);
  }
}
