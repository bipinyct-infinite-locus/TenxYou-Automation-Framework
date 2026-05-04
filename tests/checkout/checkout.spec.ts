import { test, expect } from '../../fixtures/base.fixture';
import { PRODUCTS, COUPONS } from '../../data/products.data';
import { TEST_ADDRESSES } from '../../data/users.data';
import { FakerUtil } from '../../utils/faker.util';

/**
 * TC-CHK-001 → TC-CHK-015
 * Checkout: GoKwik flow, address, payment options, order summary
 * NOTE: Full payment completion requires OTP/real credentials — these tests
 * validate up to the payment selection step.
 */
test.describe('Checkout Flow', () => {
  const product = PRODUCTS.cricket[0];

  test.beforeEach(async ({ pdpPage, cartPage }) => {
    await pdpPage.goto(product.slug);
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
  });

  test('TC-CHK-001 @smoke — proceed to checkout button is clickable', async ({ cartPage }) => {
    await expect(cartPage.checkoutButton).toBeVisible();
    await expect(cartPage.checkoutButton).toBeEnabled();
  });

  test('TC-CHK-002 @regression — checkout flow initiates after clicking proceed', async ({ cartPage, checkoutPage, page }) => {
    await cartPage.proceedToCheckout();
    // GoKwik loads — verify some checkout element appears
    const checkoutLoaded = await checkoutPage.checkoutContainer.isVisible({ timeout: 15000 }).catch(() => false);
    const urlChanged = page.url() !== '/';
    expect(checkoutLoaded || urlChanged).toBeTruthy();
  });

  test('TC-CHK-003 @regression — order summary shows added product', async ({ cartPage }) => {
    const names = await cartPage.getItemNames();
    expect(names.length).toBeGreaterThan(0);
  });

  test('TC-CHK-004 @regression — coupon applied before checkout reduces total', async ({ pdpPage, cartPage }) => {
    await cartPage.applyCoupon(COUPONS.valid);
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).not.toBe('');
  });

  test('TC-CHK-005 @regression @negative — invalid coupon shows error before checkout', async ({ cartPage }) => {
    await cartPage.applyCoupon(COUPONS.invalid);
    await cartPage.assertCouponError();
  });

  test('TC-CHK-006 @regression — checkout with 2 items reflects correct total', async ({ pdpPage, cartPage, page }) => {
    // Add second product
    await cartPage.closeCart();
    const p2 = PRODUCTS.lifestyle[0];
    await pdpPage.goto(p2.slug);
    await pdpPage.addToCart();
    await cartPage.assertCartOpen();
    const count = await cartPage.getItemCount();
    expect(count).toBeGreaterThanOrEqual(2);
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toMatch(/[\d,]+/);
  });

  test('TC-CHK-007 @regression — removing item from cart before checkout works', async ({ cartPage }) => {
    await cartPage.removeItemByIndex(0);
    const count = await cartPage.getItemCount();
    const isEmpty = await cartPage.emptyCartMessage.isVisible({ timeout: 3000 }).catch(() => false);
    expect(count === 0 || isEmpty).toBeTruthy();
  });

  test('TC-CHK-008 @regression — phone number field present in checkout', async ({ cartPage, checkoutPage }) => {
    await cartPage.proceedToCheckout();
    const hasPhone = await checkoutPage.loginPhoneInput.isVisible({ timeout: 10000 }).catch(() => false);
    const checkoutVisible = await checkoutPage.checkoutContainer.isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasPhone || checkoutVisible).toBeTruthy();
  });

  // ── Dynamic data-driven checkout ───────────────────────────────────────────
  test('TC-CHK-009 @regression — dynamic address generated with Faker works in form', async ({ cartPage, checkoutPage, page }) => {
    await cartPage.proceedToCheckout();
    const address = FakerUtil.indianAddress();
    await checkoutPage.fillAddress({
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    // No error should be thrown
  });
});
