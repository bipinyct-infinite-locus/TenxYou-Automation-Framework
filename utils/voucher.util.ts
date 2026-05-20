import { APIRequestContext } from '@playwright/test';
import {
  SaleorAdminClient,
  SaleorVoucher,
  VoucherCreateInput,
  CatalogueInput,
} from '../api/client/saleor-admin.client';
import { CacheUtil } from './cache.util';
import { Logger } from './logger';

const logger = Logger.getInstance('VoucherUtil');

export type DiscountType = 'FIXED' | 'PERCENTAGE';
export type VoucherScope = 'ENTIRE_ORDER' | 'SPECIFIC_PRODUCT';

export interface DiscountConfig {
  type: DiscountType;
  value: number;
}

export interface MinRequirements {
  minOrderValue?: number;
  minQuantity?: number;
}

export interface VoucherOptions {
  applyOncePerOrder?: boolean;  // true = cheapest item only
  minRequirements?: MinRequirements;
  scope?: VoucherScope;
  clearCacheAfter?: boolean;  // default: true
}

export interface ExclusionEntry {
  productId: string;
  variantId: string | null;
}

/** Generates a unique, deterministic coupon code per test run */
export function generateVoucherCode(type: string): string {
  return `AUTO_${type.toUpperCase()}_${Date.now()}`;
}

/**
 * High-level factory for creating, configuring, and cleaning up Saleor vouchers.
 * Always creates unique codes using AUTO_<TYPE>_<TIMESTAMP> convention.
 */
export class VoucherUtil {
  private readonly admin: SaleorAdminClient;
  private readonly createdVoucherIds: string[] = [];

  constructor(request: APIRequestContext) {
    this.admin = new SaleorAdminClient(request);
  }

  // ── Core Factories ─────────────────────────────────────────────────────────

  /** Create a fixed-amount voucher for all products */
  async createFixed(
    amount: number,
    options: VoucherOptions = {},
  ): Promise<SaleorVoucher> {
    const code = generateVoucherCode('FIXED');
    return this.createVoucher(code, { type: 'FIXED', value: amount }, options);
  }

  /** Create a percentage voucher for all products */
  async createPercentage(
    percent: number,
    options: VoucherOptions = {},
  ): Promise<SaleorVoucher> {
    const code = generateVoucherCode('PCT');
    return this.createVoucher(code, { type: 'PERCENTAGE', value: percent }, options);
  }

  /** Create a voucher scoped to specific products (by Saleor product IDs) */
  async createForProducts(
    discount: DiscountConfig,
    productIds: string[],
    options: VoucherOptions = {},
  ): Promise<SaleorVoucher> {
    const code = generateVoucherCode('PROD');
    const voucher = await this.createVoucher(code, discount, {
      ...options,
      scope: 'SPECIFIC_PRODUCT',
    });
    await this.admin.addVoucherCatalogues(voucher.id, { products: productIds });
    logger.info(`Assigned ${productIds.length} products to voucher ${code}`);
    return voucher;
  }

  /** Create a voucher scoped to specific variants (by Saleor variant IDs) */
  async createForVariants(
    discount: DiscountConfig,
    variantIds: string[],
    options: VoucherOptions = {},
  ): Promise<SaleorVoucher> {
    const code = generateVoucherCode('VAR');
    const voucher = await this.createVoucher(code, discount, {
      ...options,
      scope: 'SPECIFIC_PRODUCT',
    });
    await this.admin.addVoucherCatalogues(voucher.id, { variants: variantIds });
    logger.info(`Assigned ${variantIds.length} variants to voucher ${code}`);
    return voucher;
  }

  /** Create a voucher for a product looked up by its slug */
  async createForProductSlug(
    discount: DiscountConfig,
    productSlug: string,
    options: VoucherOptions = {},
  ): Promise<SaleorVoucher> {
    const productId = await this.admin.getProductIdBySlug(productSlug);
    return this.createForProducts(discount, [productId], options);
  }

  /** Create a voucher for the first variant of a product (by slug) */
  async createForFirstVariantOf(
    discount: DiscountConfig,
    productSlug: string,
    options: VoucherOptions = {},
  ): Promise<SaleorVoucher> {
    const variantId = await this.admin.getFirstVariantId(productSlug);
    return this.createForVariants(discount, [variantId], options);
  }

  // ── Metadata Operations ────────────────────────────────────────────────────

  /** Set excluded_products metadata on a voucher (CASE 2) */
  async setExcludedProducts(voucherId: string, exclusions: ExclusionEntry[]): Promise<void> {
    await this.admin.setVoucherExcludedProducts(voucherId, exclusions);
    logger.info(`Set ${exclusions.length} exclusions on voucher ${voucherId}`);
  }

  /** Mark a product or variant as discount-ineligible (CASE 1) */
  async disableDiscountOnObject(objectId: string): Promise<void> {
    await this.admin.setDiscountEligibility(objectId, false);
    logger.info(`Set discount_eligible=false on ${objectId}`);
  }

  /** Restore discount eligibility on a product or variant */
  async restoreDiscountEligibility(objectId: string): Promise<void> {
    await this.admin.deleteMetadata(objectId, ['discount_eligible']);
    logger.info(`Removed discount_eligible metadata from ${objectId}`);
  }

  /** Remove excluded_products metadata from a voucher */
  async clearExcludedProducts(voucherId: string): Promise<void> {
    await this.admin.deleteMetadata(voucherId, ['excluded_products']);
    logger.info(`Cleared excluded_products from voucher ${voucherId}`);
  }

  // ── Lookup Helpers ─────────────────────────────────────────────────────────

  async getProductId(slug: string): Promise<string> {
    return this.admin.getProductIdBySlug(slug);
  }

  async getVariantId(productSlug: string, variantName: string): Promise<string> {
    return this.admin.getVariantIdBySlugAndName(productSlug, variantName);
  }

  async getFirstVariantId(productSlug: string): Promise<string> {
    return this.admin.getFirstVariantId(productSlug);
  }

  async getAdminClient(): Promise<SaleorAdminClient> {
    return this.admin;
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  async clearCache(request: APIRequestContext): Promise<void> {
    await CacheUtil.clearAll(request);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /** Delete all vouchers created by this instance */
  async cleanupAll(): Promise<void> {
    if (!this.createdVoucherIds.length) return;
    logger.info(`Cleaning up ${this.createdVoucherIds.length} vouchers`);
    for (const id of this.createdVoucherIds) {
      await this.admin.deleteVoucher(id).catch((e) =>
        logger.warn(`Cleanup failed for ${id}: ${(e as Error).message}`),
      );
    }
    this.createdVoucherIds.length = 0;
  }

  /** Delete a specific voucher and remove from tracking */
  async cleanup(voucherId: string): Promise<void> {
    await this.admin.deleteVoucher(voucherId).catch((e) =>
      logger.warn(`Cleanup failed for ${voucherId}: ${(e as Error).message}`),
    );
    const idx = this.createdVoucherIds.indexOf(voucherId);
    if (idx !== -1) this.createdVoucherIds.splice(idx, 1);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async createVoucher(
    code: string,
    discount: DiscountConfig,
    options: VoucherOptions,
  ): Promise<SaleorVoucher> {
    const { applyOncePerOrder = false, minRequirements, scope = 'ENTIRE_ORDER' } = options;

    const input: VoucherCreateInput = {
      name: `[AUTO TEST] ${code}`,
      code,
      type: scope,
      discountValueType: discount.type,
      applyOncePerOrder,
      startDate: new Date().toISOString(),
    };

    const channelListing = {
      discountValue: discount.value,
      ...(minRequirements?.minOrderValue !== undefined && {
        minAmountSpent: minRequirements.minOrderValue,
      }),
      ...(minRequirements?.minQuantity !== undefined && {
        minCheckoutItemsQuantity: minRequirements.minQuantity,
      }),
    };

    const voucher = await this.admin.createVoucher(input, channelListing);
    this.createdVoucherIds.push(voucher.id);

    // Required: coupon is only rendered on the cart page when show_on_cart=true
    await this.admin.updateMetadata(voucher.id, { show_on_cart: 'true' });
    logger.info(`Set show_on_cart=true on voucher ${voucher.id}`);

    return voucher;
  }

  /** Create catalogue assignment on an existing voucher */
  async assignCatalogues(voucherId: string, input: CatalogueInput): Promise<void> {
    await this.admin.addVoucherCatalogues(voucherId, input);
  }
}
