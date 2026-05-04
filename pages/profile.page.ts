import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page, 'ProfilePage');
  }

  get profileContainer(): Locator {
    return this.page.locator('[class*="profile"], [class*="account"]').first();
  }

  get orderHistorySection(): Locator {
    return this.page.locator('[class*="order-history"], :text("My Orders"), :text("Order History")').first();
  }

  get orderCards(): Locator {
    return this.page.locator('[class*="order-card"], [class*="OrderCard"]');
  }

  get addressSection(): Locator {
    return this.page.locator('[class*="address"], :text("Saved Addresses"), :text("My Addresses")').first();
  }

  get logoutButton(): Locator {
    return this.page.getByRole('button', { name: /logout|sign out/i }).first();
  }

  get editProfileButton(): Locator {
    return this.page.getByRole('button', { name: /edit profile|update profile/i }).first();
  }

  get userEmail(): Locator {
    return this.page.locator('[class*="user-email"], [class*="profile-email"]').first();
  }

  get userName(): Locator {
    return this.page.locator('[class*="user-name"], [class*="profile-name"]').first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async open(): Promise<void> {
    await this.accountIcon.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async viewOrderHistory(): Promise<void> {
    await this.orderHistorySection.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async getOrderCount(): Promise<number> {
    return this.orderCards.count();
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertLoggedIn(): Promise<void> {
    await expect(this.profileContainer).toBeVisible({ timeout: 5000 });
  }

  async assertOrdersVisible(): Promise<void> {
    await expect(this.orderCards.first()).toBeVisible({ timeout: 10000 });
  }
}
