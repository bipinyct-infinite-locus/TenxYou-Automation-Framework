import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page, 'CartPage');
  }

  // ── Cart (/cart page) ─────────────────────────────────────────────────────
  // After addToCart() the site navigates to /cart (full page, not a drawer).
  // cartDrawer is the CHECKOUT button in the sticky bottom bar — only present on /cart.
  get cartDrawer(): Locator {
    return this.page.getByRole('button', { name: /^checkout$/i });
  }

  // Each cart item has a "Size :" h2 heading — one per item.
  // The page has mobile (hidden) + desktop (visible) copies; count() includes both.
  get cartItems(): Locator {
    return this.page
      .locator('[class*="cart-item"], [class*="CartItem"]')
      .or(this.page.locator('h2').filter({ hasText: /size\s*:/i }));
  }

  get cartItemNames(): Locator {
    return this.page.locator('[class*="cart-item"] [class*="name"], [class*="CartItem"] [class*="title"]');
  }

  get cartItemPrices(): Locator {
    return this.page.locator('[class*="cart-item"] [class*="price"]');
  }

  get cartItemQuantities(): Locator {
    return this.page.locator('[class*="cart-item"] [class*="qty"], [class*="quantity-selector"]');
  }

  // Remove item: decrement at qty=1 triggers a "REMOVE ITEM"/"KEEP ITEM" confirm popup.
  get removeItemButtons(): Locator {
    return this.page
      .locator('[aria-label*="remove" i], [class*="remove-item"]')
      .or(this.page.locator('button:visible:has(svg use[href*="icons--decrement"])'));
  }

  // Qty buttons — :visible skips the mobile (md:hidden) SSR duplicate copies
  get increaseQtyButtons(): Locator {
    return this.page.locator('button:visible:has(svg use[href*="icons--increment"])');
  }

  get decreaseQtyButtons(): Locator {
    return this.page.locator('button:visible:has(svg use[href*="icons--decrement"])');
  }

  // Subtotal: "You pay ₹X" section
  get cartSubtotal(): Locator {
    return this.page
      .locator('[class*="subtotal"]')
      .or(this.page.getByText(/You\s+pay/i).locator('..'))
      .first();
  }

  get cartTotal(): Locator {
    return this.page.locator('[class*="cart-total"], [class*="CartTotal"]').first();
  }

  get checkoutButton(): Locator {
    return this.page.getByRole('button', { name: /proceed to checkout|checkout|buy now/i }).first();
  }

  get continueShoppingButton(): Locator {
    return this.page.getByRole('button', { name: /continue shopping/i }).first();
  }

  get emptyCartMessage(): Locator {
    return this.page
      .locator(':text("empty cart"), :text("Your cart is empty"), [class*="empty-cart"]')
      .or(this.page.getByText('Your kit is empty', { exact: false }))
      .first();
  }

  // Coupon input — two copies exist (mobile md:hidden + desktop visible); :visible picks desktop
  get couponInput(): Locator {
    return this.page
      .locator('input:visible[placeholder*="coupon" i], input:visible[placeholder*="promo" i]')
      .first();
  }

  // Coupon submit uses coupon-arrow SVG sprite — :visible skips the mobile duplicate
  get applyCouponButton(): Locator {
    return this.page.locator('button:visible:has(svg use[href*="coupon-arrow"])').first();
  }

  get couponSuccessMsg(): Locator {
    return this.page
      .locator('[class*="coupon-success"]')
      .or(this.page.getByText(/coupon applied|discount applied/i))
      .first();
  }

  // Site shows "This is an invalid coupon" for bad codes
  get couponErrorMsg(): Locator {
    return this.page
      .locator('[class*="coupon-error"]')
      .or(this.page.getByText(/invalid coupon|this is an invalid|coupon.*not found|not valid|expired/i))
      .first();
  }

  get closeCartButton(): Locator {
    return this.page
      .locator('[aria-label*="close cart" i], [class*="close-cart"], [data-testid="close-cart"]')
      .first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async openCart(): Promise<void> {
    const url = this.page.url();
    if (url === 'about:blank' || url === '') {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
      await WaitUtil.forDOMContentLoaded(this.page);
    }
    if (url.includes('/cart')) return; // already on cart page
    await this.cartIcon.click();
    const navigated = await this.page.waitForURL(/\/cart/, { timeout: 5000 }).then(() => true).catch(() => false);
    if (!navigated) {
      // Cart icon may open a drawer — force-navigate to /cart page
      await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
    }
  }

  async getItemCount(): Promise<number> {
    await WaitUtil.sleep(1500);
    // increaseQtyButtons uses :visible so it naturally counts one button per rendered cart row
    const byBtn = await this.increaseQtyButtons.count();
    if (byBtn > 0) return byBtn;
    return this.cartItems.count();
  }

  async getSubtotal(): Promise<string> {
    return (await this.cartSubtotal.textContent()) || '';
  }

  async removeItemByIndex(index = 0): Promise<void> {
    // Clicking decrement at qty=1 opens "REMOVE ITEM"/"KEEP ITEM" confirmation popup
    await this.decreaseQtyButtons.nth(index).click();
    const confirmRemove = this.page.getByRole('button', { name: 'REMOVE ITEM' });
    if (await confirmRemove.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmRemove.click();
      await WaitUtil.sleep(1000);
    } else {
      await WaitUtil.sleep(500);
    }
  }

  async increaseQuantity(itemIndex = 0): Promise<void> {
    await this.increaseQtyButtons.nth(itemIndex).click();
    await WaitUtil.sleep(500);
  }

  async decreaseQuantity(itemIndex = 0): Promise<void> {
    // Dismiss any open portal overlay (e.g. leftover remove-confirmation modal) before clicking
    const overlay = this.page.locator('#portal div.fixed').first();
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await WaitUtil.sleep(300);
    }
    await this.decreaseQtyButtons.nth(itemIndex).click();
    await WaitUtil.sleep(500);
  }

  async applyCoupon(code: string): Promise<void> {
    if (!code) return;
    if (await this.couponInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.couponInput.fill(code);
      await this.applyCouponButton.click();
      await WaitUtil.sleep(1500);
    }
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  // Cart is the /cart page — "closing" means navigating back to the previous page
  async closeCart(): Promise<void> {
    if (this.page.url().includes('/cart')) {
      await this.page.goBack();
      await WaitUtil.forDOMContentLoaded(this.page);
    } else if (await this.closeCartButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.closeCartButton.click();
      await WaitUtil.sleep(300);
    } else {
      await this.page.keyboard.press('Escape');
      await WaitUtil.sleep(300);
    }
  }

  async getItemNames(): Promise<string[]> {
    const items = await this.cartItemNames.allTextContents();
    return items.map((n) => n.trim());
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertCartOpen(): Promise<void> {
    // Cart is the /cart page — CHECKOUT button in sticky bar is present when items exist
    await expect(this.cartDrawer).toBeVisible({ timeout: 15000 });
  }

  async assertItemCount(count: number): Promise<void> {
    const actual = await this.getItemCount();
    expect(actual).toBe(count);
  }

  async assertItemInCart(productName: string): Promise<void> {
    const names = await this.getItemNames();
    const found = names.some((n) => n.toLowerCase().includes(productName.toLowerCase()));
    expect(found, `Expected "${productName}" in cart, got: ${names.join(', ')}`).toBeTruthy();
  }

  async assertCartEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible({ timeout: 5000 });
  }

  async assertCouponApplied(): Promise<void> {
    await expect(this.couponSuccessMsg).toBeVisible({ timeout: 5000 });
  }

  async assertCouponError(): Promise<void> {
    await expect(this.couponErrorMsg).toBeVisible({ timeout: 5000 });
  }
}
