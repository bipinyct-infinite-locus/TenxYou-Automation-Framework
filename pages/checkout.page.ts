import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page, 'CheckoutPage');
  }

  // ── GoKwik Checkout (overlay/iframe) ─────────────────────────────────────
  get checkoutContainer(): Locator {
    return this.page.locator('[class*="gokwik"], [class*="checkout"], [id*="gokwik"]').first();
  }

  get checkoutIframe(): Locator {
    return this.page.frameLocator('iframe[src*="gokwik"]').first().locator('body');
  }

  // ── Address Form ──────────────────────────────────────────────────────────
  get firstNameInput(): Locator {
    return this.page.locator('input[name*="first" i], input[placeholder*="first name" i]').first();
  }

  get lastNameInput(): Locator {
    return this.page.locator('input[name*="last" i], input[placeholder*="last name" i]').first();
  }

  get phoneInput(): Locator {
    return this.page.locator('input[type="tel"], input[name*="phone" i], input[placeholder*="phone" i]').first();
  }

  get addressLine1Input(): Locator {
    return this.page.locator('input[name*="address1" i], input[name*="line1" i], input[placeholder*="address" i]').first();
  }

  get addressLine2Input(): Locator {
    return this.page.locator('input[name*="address2" i], input[name*="line2" i], input[placeholder*="apartment" i]').first();
  }

  get cityInput(): Locator {
    return this.page.locator('input[name*="city" i], input[placeholder*="city" i]').first();
  }

  get stateInput(): Locator {
    return this.page.locator('input[name*="state" i], select[name*="state" i]').first();
  }

  get pincodeInput(): Locator {
    return this.page.locator('input[name*="pin" i], input[placeholder*="pincode" i], input[placeholder*="zip" i]').first();
  }

  // ── Order Summary ─────────────────────────────────────────────────────────
  get orderSummary(): Locator {
    return this.page.locator('[class*="order-summary"], [class*="OrderSummary"]').first();
  }

  get orderTotal(): Locator {
    return this.page.locator('[class*="total"], :text("Total")').last();
  }

  get deliveryCharge(): Locator {
    return this.page.locator(':text-matches("delivery|shipping", "i")').first();
  }

  get couponDiscountLine(): Locator {
    return this.page.locator('[class*="discount"], :text-matches("discount|coupon", "i")').first();
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  get upiOption(): Locator {
    return this.page.locator('[value*="upi" i], :text("UPI"), [id*="upi" i]').first();
  }

  get codOption(): Locator {
    return this.page.locator('[value*="cod" i], :text("Cash on Delivery"), :text("COD")').first();
  }

  get cardOption(): Locator {
    return this.page.locator('[value*="card" i], :text("Credit"), :text("Debit Card")').first();
  }

  get placeOrderButton(): Locator {
    return this.page.getByRole('button', { name: /place order|confirm order|pay now/i }).first();
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: /continue|next/i }).first();
  }

  // ── Order Confirmation ────────────────────────────────────────────────────
  get orderConfirmation(): Locator {
    return this.page.locator('[class*="confirmation"], :text("Order Confirmed"), :text("Thank you")').first();
  }

  get orderNumber(): Locator {
    return this.page.locator('[class*="order-number"], :text-matches("#\\d+|Order \\d+", "")').first();
  }

  // ── Login / Phone ─────────────────────────────────────────────────────────
  get loginPhoneInput(): Locator {
    return this.page.locator('input[type="tel"], input[name*="phone"]').first();
  }

  get sendOtpButton(): Locator {
    return this.page.getByRole('button', { name: /send otp|continue/i }).first();
  }

  get otpInputs(): Locator {
    return this.page.locator('input[name*="otp"], input[placeholder*="otp" i], input[maxlength="1"]');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async fillAddress(address: Address): Promise<void> {
    await WaitUtil.sleep(1000);

    if (await this.firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.firstNameInput.fill(address.firstName);
    }
    if (await this.lastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.lastNameInput.fill(address.lastName);
    }
    if (await this.phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.phoneInput.fill(address.phone);
    }
    await this.addressLine1Input.fill(address.addressLine1);
    if (address.addressLine2 && await this.addressLine2Input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.addressLine2Input.fill(address.addressLine2);
    }
    await this.cityInput.fill(address.city);
    await this.pincodeInput.fill(address.pincode);

    await WaitUtil.sleep(500);
  }

  async selectCOD(): Promise<void> {
    if (await this.codOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.codOption.click();
      await WaitUtil.sleep(300);
    }
  }

  async selectUPI(): Promise<void> {
    if (await this.upiOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.upiOption.click();
      await WaitUtil.sleep(300);
    }
  }

  async getOrderTotal(): Promise<string> {
    return (await this.orderTotal.textContent()) || '';
  }

  async getOrderNumber(): Promise<string> {
    return (await this.orderNumber.textContent()) || '';
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertCheckoutLoaded(): Promise<void> {
    await expect(this.checkoutContainer).toBeVisible({ timeout: 15000 });
  }

  async assertOrderConfirmed(): Promise<void> {
    await expect(this.orderConfirmation).toBeVisible({ timeout: 30000 });
  }
}
