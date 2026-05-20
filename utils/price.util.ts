import { expect } from '@playwright/test';
import { Logger } from './logger';

const logger = Logger.getInstance('PriceUtil');

/**
 * Parses an Indian Rupee price string to a numeric value.
 * Handles: "₹2,999", "₹1,499.99", "-₹200", "2999", "Rs. 1,000"
 */
export function parseINR(text: string): number {
  const cleaned = text.replace(/[₹Rs.,\s]/gi, '').replace(/^-/, '');
  const value = parseFloat(cleaned);
  if (isNaN(value)) {
    logger.warn(`Could not parse price from: "${text}"`);
    return 0;
  }
  return value;
}

/** Extract a positive numeric value from a string that may contain negative signs / currency */
export function parseAbsoluteINR(text: string): number {
  return Math.abs(parseINR(text));
}

export type DiscountType = 'FIXED' | 'PERCENTAGE';

/**
 * Calculate the expected final total after applying a fixed discount.
 * Returns max(0, subtotal - discountAmount).
 */
export function calcFixedTotal(subtotal: number, discountAmount: number): number {
  return Math.max(0, subtotal - discountAmount);
}

/**
 * Calculate the expected discount amount for a percentage voucher.
 * Returns floor to 2 decimal places (Saleor rounds down).
 */
export function calcPercentageDiscount(subtotal: number, percent: number): number {
  return Math.floor((subtotal * percent) / 100 * 100) / 100;
}

/**
 * For applyOncePerOrder=true (cheapest item only):
 * Returns the discount on only the cheapest item price in the list.
 */
export function calcCheapestItemDiscount(
  prices: number[],
  type: DiscountType,
  discountValue: number,
): number {
  if (!prices.length) return 0;
  const cheapest = Math.min(...prices);
  if (type === 'FIXED') {
    return Math.min(discountValue, cheapest);
  }
  return calcPercentageDiscount(cheapest, discountValue);
}

/**
 * For applyOncePerOrder=false (all eligible items):
 * Returns total discount across all prices.
 */
export function calcAllItemsDiscount(
  prices: number[],
  type: DiscountType,
  discountValue: number,
): number {
  if (!prices.length) return 0;
  if (type === 'FIXED') {
    return Math.min(discountValue * prices.length, prices.reduce((a, b) => a + b, 0));
  }
  return prices.reduce((sum, price) => sum + calcPercentageDiscount(price, discountValue), 0);
}

/**
 * Assert that two price values are equal within a tolerance (default ±2 INR for rounding).
 * Logs both values for debugging on failure.
 */
export function assertDiscount(
  expected: number,
  actual: number,
  label = 'discount',
  toleranceINR = 2,
): void {
  const diff = Math.abs(expected - actual);
  logger.info(`${label}: expected=₹${expected} actual=₹${actual} diff=₹${diff}`);
  expect(
    diff <= toleranceINR,
    `${label} mismatch: expected ₹${expected} (±${toleranceINR}), got ₹${actual}`,
  ).toBe(true);
}

/**
 * Assert that final total = subtotal - discount within tolerance.
 */
export function assertTotalAfterDiscount(
  subtotal: number,
  discount: number,
  finalTotal: number,
  toleranceINR = 2,
): void {
  const expectedTotal = Math.max(0, subtotal - discount);
  assertDiscount(expectedTotal, finalTotal, 'finalTotal', toleranceINR);
}

export const PriceUtil = {
  parseINR,
  parseAbsoluteINR,
  calcFixedTotal,
  calcPercentageDiscount,
  calcCheapestItemDiscount,
  calcAllItemsDiscount,
  assertDiscount,
  assertTotalAfterDiscount,
};
