import { DiscountConfig, VoucherOptions, ExclusionEntry } from '../utils/voucher.util';
import { PRODUCTS } from './products.data';

// ── Voucher Code Generator ─────────────────────────────────────────────────────

export function generateVoucherCode(type: string): string {
  return `AUTO_${type.toUpperCase()}_${Date.now()}`;
}

// ── Staging Product References ─────────────────────────────────────────────────
// These slugs are used to dynamically look up Saleor product/variant IDs at test runtime

export const VOUCHER_TEST_PRODUCTS = {
  // Products used for "specific product" voucher tests
  primary: PRODUCTS.cricket[0],    // All-Rounder Cricket Shoe Lime Green
  secondary: PRODUCTS.cricket[1],  // All-Rounder Cricket Shoe Bright White
  apparel: PRODUCTS.apparel[0],    // FlowState Kick Flare Pants
  lifestyle: PRODUCTS.lifestyle[0], // Crossover Bungee Lacing Sneaker Sage
  accessory: PRODUCTS.accessories[0], // Club Cap
};

// ── Known Staging Saleor IDs (from task brief) ────────────────────────────────
// Used for CASE 2 excluded_products metadata tests.
// These are the exact IDs provided in the requirement spec.

export const KNOWN_STAGING_IDS = {
  excludedProduct: {
    productId: 'UHJvZHVjdDoxOTU=',           // Product:195
    variantId: 'UHJvZHVjdFZhcmlhbnQ6NDg0',   // ProductVariant:484
  },
} as const;

// ── Discount Configs ───────────────────────────────────────────────────────────

export const DISCOUNT_CONFIGS = {
  fixed200: { type: 'FIXED', value: 200 } as DiscountConfig,
  fixed500: { type: 'FIXED', value: 500 } as DiscountConfig,
  fixed100: { type: 'FIXED', value: 100 } as DiscountConfig,
  pct10: { type: 'PERCENTAGE', value: 10 } as DiscountConfig,
  pct20: { type: 'PERCENTAGE', value: 20 } as DiscountConfig,
  pct15: { type: 'PERCENTAGE', value: 15 } as DiscountConfig,
};

// ── Option Presets ─────────────────────────────────────────────────────────────

export const VOUCHER_OPTIONS = {
  // All eligible products get discount
  allProducts: { applyOncePerOrder: false } as VoucherOptions,

  // Only cheapest eligible product gets discount
  cheapestOnly: { applyOncePerOrder: true } as VoucherOptions,

  // Minimum order value: ₹1500
  minOrder1500: {
    minRequirements: { minOrderValue: 1500 },
  } as VoucherOptions,

  // Minimum order value: ₹99999 (impossible to meet — for negative tests)
  minOrderImpossible: {
    minRequirements: { minOrderValue: 99999 },
  } as VoucherOptions,

  // Minimum quantity: 2 items
  minQty2: {
    minRequirements: { minQuantity: 2 },
  } as VoucherOptions,

  // Minimum quantity: 99 (impossible — for negative tests)
  minQtyImpossible: {
    minRequirements: { minQuantity: 99 },
  } as VoucherOptions,
};

// ── Exclusion Scenarios ────────────────────────────────────────────────────────

export const EXCLUSION_SCENARIOS = {
  // Exclude a specific variant of a product
  excludeVariant: [
    {
      productId: KNOWN_STAGING_IDS.excludedProduct.productId,
      variantId: KNOWN_STAGING_IDS.excludedProduct.variantId,
    },
  ] as ExclusionEntry[],

  // Exclude an entire product (variantId = null)
  excludeProduct: [
    {
      productId: KNOWN_STAGING_IDS.excludedProduct.productId,
      variantId: null,
    },
  ] as ExclusionEntry[],
};

// ── Full Scenario Matrix ───────────────────────────────────────────────────────

export const COUPON_SCENARIO_MATRIX = [
  // CORE scenarios
  { id: 'TC-CPN-001', tag: '@coupon @regression @saleor', desc: 'Fixed ₹200 off - all products - entire order', discount: DISCOUNT_CONFIGS.fixed200, options: VOUCHER_OPTIONS.allProducts },
  { id: 'TC-CPN-002', tag: '@coupon @regression @saleor', desc: 'Fixed ₹200 off - cheapest item only',           discount: DISCOUNT_CONFIGS.fixed200, options: VOUCHER_OPTIONS.cheapestOnly },
  { id: 'TC-CPN-003', tag: '@coupon @regression @saleor', desc: 'Percentage 10% off - all products',             discount: DISCOUNT_CONFIGS.pct10,    options: VOUCHER_OPTIONS.allProducts },
  { id: 'TC-CPN-004', tag: '@coupon @regression @saleor', desc: 'Percentage 10% off - cheapest item only',       discount: DISCOUNT_CONFIGS.pct10,    options: VOUCHER_OPTIONS.cheapestOnly },

  // Minimum order
  { id: 'TC-CPN-009', tag: '@coupon @regression @saleor', desc: 'Minimum order value met → coupon applies',      discount: DISCOUNT_CONFIGS.fixed200, options: VOUCHER_OPTIONS.minOrder1500 },
  { id: 'TC-CPN-010', tag: '@coupon @regression @saleor', desc: 'Minimum order not met → coupon rejected',       discount: DISCOUNT_CONFIGS.fixed200, options: VOUCHER_OPTIONS.minOrderImpossible },

  // Minimum quantity
  { id: 'TC-CPN-011', tag: '@coupon @regression @saleor', desc: 'Minimum quantity met → coupon applies',         discount: DISCOUNT_CONFIGS.fixed200, options: VOUCHER_OPTIONS.minQty2 },
  { id: 'TC-CPN-012', tag: '@coupon @regression @saleor', desc: 'Minimum quantity not met → coupon rejected',    discount: DISCOUNT_CONFIGS.fixed200, options: VOUCHER_OPTIONS.minQtyImpossible },
] as const;

// ── Negative Test Data ────────────────────────────────────────────────────────

export const NEGATIVE_COUPON_CODES = {
  invalid: 'INVALID_CODE_99999',
  expired: 'EXPIRED_CODE_99999',
  empty: '',
  special: '!@#$%^&*()',
  sql: "' OR '1'='1",
  longCode: 'A'.repeat(255),
} as const;
