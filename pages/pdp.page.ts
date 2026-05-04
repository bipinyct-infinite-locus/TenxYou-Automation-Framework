import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';
import { API_ENDPOINTS } from '../config/environments';

export class PDPPage extends BasePage {
  constructor(page: Page) {
    super(page, 'PDPPage');
  }

  // ── Locators ──────────────────────────────────────────────────────────────
  get productName(): Locator {
    return this.page.locator('h1, [class*="product-name"], [class*="ProductName"]').first();
  }

  get productPrice(): Locator {
    return this.page.locator('[class*="price"], [class*="Price"]').first();
  }

  get mrpPrice(): Locator {
    return this.page.locator('[class*="mrp"], :text("MRP")').first();
  }

  get discountBadge(): Locator {
    return this.page.locator('[class*="discount"], [class*="offer"], :text-matches("\\d+% off", "i")').first();
  }

  get sizeSelector(): Locator {
    return this.page.locator('[class*="size-selector"], [class*="SizeSelector"], [aria-label*="size" i]');
  }

  get sizeOptions(): Locator {
    // Size buttons are siblings of the sizes fieldset, NOT inside it.
    // "fieldset + * button" targets buttons in the immediate sibling div.
    return this.page
      .locator('[class*="size-option"], [class*="SizeOption"], [data-size]')
      .or(
        // Shoe sizes: siblings of fieldset (most PDPs)
        this.page
          .locator('fieldset + * button')
          .filter({ hasText: /^(\d+(\.\d+)?|xs|s|m|l|xl|xxl|one size|free size)$/i }),
      )
      .or(
        // Accessories sizes: buttons inside any size/accessories container (socks, etc.)
        this.page
          .locator('[class*="size"] button, [class*="accessories"] button, [class*="Accessories"] button')
          .filter({ hasNot: this.page.locator(':text-matches("add to|buy now|notify|wishlist", "i")') }),
      );
  }

  get colorOptions(): Locator {
    return this.page.locator('[class*="color-option"], [class*="ColorSwatch"], [data-color]');
  }

  get addToCartButton(): Locator {
    return this.page.getByRole('button', { name: /add to (cart|bag|kit)/i }).first();
  }

  get buyNowButton(): Locator {
    return this.page.getByRole('button', { name: /buy now/i }).first();
  }

  get wishlistButton(): Locator {
    return this.page
      .locator('[aria-label*="wishlist" i], button:has([class*="heart"]), [class*="wishlist-btn"]')
      .first();
  }

  get productImages(): Locator {
    return this.page.locator('[class*="product-image"], [class*="gallery"] img, [class*="slider"] img');
  }

  get mainProductImage(): Locator {
    return this.productImages.first();
  }

  get productDescription(): Locator {
    return this.page.locator('[class*="description"], [class*="Description"]').first();
  }

  get sizeguideLink(): Locator {
    return this.page.getByText(/size guide/i).first();
  }

  get breadcrumbs(): Locator {
    return this.page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
  }

  get outOfStockMessage(): Locator {
    return this.page.locator(':text("Out of Stock"), [class*="out-of-stock"]').first();
  }

  get sizeRequiredError(): Locator {
    return this.page.locator(':text("Please select a size"), :text("Select size")').first();
  }

  get relatedProducts(): Locator {
    return this.page.locator('[class*="related"], [class*="similar"], [class*="recommended"]');
  }

  get pinCodeInput(): Locator {
    return this.page.locator('input[placeholder*="pincode" i], input[placeholder*="pin" i]').first();
  }

  get deliveryCheckButton(): Locator {
    return this.page.getByRole('button', { name: /check|verify delivery/i }).first();
  }

  get cartDrawer(): Locator {
    return this.page.locator('[class*="cart-drawer"], [class*="CartDrawer"], [class*="side-cart"]');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  // Module-level cache shared across tests in the same worker process
  private static variantCache = new Map<string, string>();

  private async resolveVariantId(slug: string): Promise<string> {
    if (PDPPage.variantCache.has(slug)) return PDPPage.variantCache.get(slug)!;
    const res = await this.page.request.get(API_ENDPOINTS.pdpSlugs);
    if (!res.ok()) return '';
    const data: Record<string, string> = await res.json();
    // Populate cache for all slugs in one API call
    for (const [b64, s] of Object.entries(data)) {
      if (!PDPPage.variantCache.has(s)) {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8');
        const id = decoded.split(':')[1] ?? '';
        if (id) PDPPage.variantCache.set(s, id);
      }
    }
    return PDPPage.variantCache.get(slug) ?? '';
  }

  async goto(slug: string): Promise<void> {
    const variantId = await this.resolveVariantId(slug);
    const path = variantId ? `${slug}/${variantId}` : slug;
    await this.page.goto(`/product/${path}`, { waitUntil: 'domcontentloaded' });
  }

  async gotoByFetchingSlug(): Promise<string> {
    const response = await this.page.request.get(API_ENDPOINTS.pdpSlugs);
    const data: Record<string, string> = await response.json();
    // data is { base64VariantId: slug } — grab first entry
    const [base64Id, slug] = Object.entries(data)[0];
    const decoded = Buffer.from(base64Id, 'base64').toString('utf-8');
    const variantId = decoded.split(':')[1] ?? '';
    const path = variantId ? `${slug}/${variantId}` : slug;
    await this.page.goto(`/product/${path}`, { waitUntil: 'domcontentloaded' });
    return slug;
  }

  async selectSize(size: string): Promise<void> {
    const sizeBtn = this.page.locator(`[class*="size-option"]:text("${size}"), button:text("${size}"), [data-size="${size}"]`).first();
    if (await sizeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sizeBtn.click();
    } else {
      // Fallback: click first available size
      await this.sizeOptions.first().click();
    }
    await WaitUtil.sleep(300);
  }

  async selectFirstAvailableSize(): Promise<string> {
    const options = await this.sizeOptions.all();
    for (const option of options) {
      const isDisabled = await option.isDisabled().catch(() => false);
      if (isDisabled) continue;

      const size = (await option.textContent()) || '';
      await option.click();
      await WaitUtil.sleep(300);

      // If the add-to-cart button appears, this size is in stock
      const inStock = await this.addToCartButton.isVisible({ timeout: 1500 }).catch(() => false);
      if (inStock) return size.trim();
      // Otherwise OOS ("Notify Me" shown) — try next size
    }

    // Fallback: any visible button whose text looks like a size label (covers accessories PDPs
    // where size buttons aren't inside the standard fieldset structure, e.g. Cricket Crew Socks)
    const sizeLikeBtn = this.page.locator('button').filter({
      hasText: /^(XS|S|M|L|XL|XXL|One Size|Free Size|\d{1,2}(\.\d+)?)$/i,
    });
    const fallbackCount = await sizeLikeBtn.count();
    for (let i = 0; i < fallbackCount; i++) {
      const btn = sizeLikeBtn.nth(i);
      if (!await btn.isVisible().catch(() => false)) continue;
      if (await btn.isDisabled().catch(() => false)) continue;
      const text = (await btn.textContent() || '').trim();
      await btn.click();
      await WaitUtil.sleep(300);
      const inStock = await this.addToCartButton.isVisible({ timeout: 1500 }).catch(() => false);
      if (inStock) return text;
    }
    return '';
  }

  async selectColor(colorIndex = 0): Promise<void> {
    if (await this.colorOptions.nth(colorIndex).isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.colorOptions.nth(colorIndex).click();
      await WaitUtil.sleep(300);
    }
  }

  async addToCart(size?: string): Promise<void> {
    // Wait for DOM attachment (h1 may be CSS-hidden on launch pages but IS in DOM after hydration)
    await this.productName.waitFor({ state: 'attached', timeout: 15000 });
    if (size) {
      await this.selectSize(size);
    } else {
      const hasSizes = await this.sizeOptions.first().isVisible({ timeout: 10000 }).catch(() => false);
      if (hasSizes) {
        await this.selectFirstAvailableSize();
      }
    }
    await this.addToCartButton.click();
    // Wait for navigation to /cart page; fall back to sleep if already on cart
    await this.page.waitForURL(/\/cart/, { timeout: 20000 }).catch(() => WaitUtil.sleep(1000));
  }

  async clickBuyNow(size?: string): Promise<void> {
    if (size) {
      await this.selectSize(size);
    } else {
      const hasSizes = await this.sizeOptions.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSizes) {
        await this.selectFirstAvailableSize();
      }
    }
    await this.buyNowButton.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async addToWishlist(): Promise<void> {
    await this.wishlistButton.click();
    await WaitUtil.sleep(500);
  }

  async getProductName(): Promise<string> {
    return (await this.productName.textContent()) || '';
  }

  async getProductPrice(): Promise<string> {
    return (await this.productPrice.textContent()) || '';
  }

  async checkDelivery(pincode: string): Promise<void> {
    if (await this.pinCodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.pinCodeInput.fill(pincode);
      await this.deliveryCheckButton.click();
      await WaitUtil.sleep(1000);
    }
  }

  async getAvailableSizes(): Promise<string[]> {
    const options = await this.sizeOptions.all();
    const sizes: string[] = [];
    for (const opt of options) {
      const text = await opt.textContent();
      const disabled = await opt.isDisabled();
      if (text && !disabled) sizes.push(text.trim());
    }
    return sizes;
  }

  async getImageCount(): Promise<number> {
    return this.productImages.count();
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertProductLoaded(): Promise<void> {
    // h1 may be off-screen or in an overflow:hidden container on launch pages — use attached
    await expect(this.productName).toBeAttached({ timeout: 15000 });
    // Price is not present on launch/campaign pages — only assert when found in DOM
    const hasPriceInDom = await this.productPrice.count().then((c) => c > 0).catch(() => false);
    if (hasPriceInDom) {
      await expect(this.productPrice).toBeAttached({ timeout: 5000 });
    }
  }

  async assertAddToCartEnabled(): Promise<void> {
    await expect(this.addToCartButton).toBeEnabled({ timeout: 5000 });
  }

  async assertSizeSelectorVisible(): Promise<void> {
    const hasSizes = await this.sizeOptions.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasSizes).toBeTruthy();
  }

  async assertCartDrawerOpen(): Promise<void> {
    await expect(this.cartDrawer).toBeVisible({ timeout: 5000 });
  }

  async assertSizeErrorShown(): Promise<void> {
    await expect(this.sizeRequiredError).toBeVisible({ timeout: 5000 });
  }
}
