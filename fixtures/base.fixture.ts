import { test as base, expect, APIRequestContext } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { PLPPage } from '../pages/plp.page';
import { PDPPage } from '../pages/pdp.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { SearchPage } from '../pages/search.page';
import { WishlistPage } from '../pages/wishlist.page';
import { ProfilePage } from '../pages/profile.page';
import { APIClient } from '../api/client/api-client';
import { DB } from '../utils/db.util';

// ── Fixture types ─────────────────────────────────────────────────────────────
type Pages = {
  homePage: HomePage;
  plpPage: PLPPage;
  pdpPage: PDPPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  searchPage: SearchPage;
  wishlistPage: WishlistPage;
  profilePage: ProfilePage;
};

type APIs = {
  apiClient: APIClient;
};

type Helpers = {
  db: typeof DB;
};

export type TenxYouFixtures = Pages & APIs & Helpers;

// ── Extended test with all page objects and helpers ────────────────────────────
export const test = base.extend<TenxYouFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  plpPage: async ({ page }, use) => {
    await use(new PLPPage(page));
  },

  pdpPage: async ({ page }, use) => {
    await use(new PDPPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },

  wishlistPage: async ({ page }, use) => {
    await use(new WishlistPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  apiClient: async ({ request }, use) => {
    await use(new APIClient(request));
  },

  db: async ({}, use) => {
    await use(DB);
    // Pool stays open across tests, closed in global teardown
  },
});

export { expect };
