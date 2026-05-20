import { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ENV, SALEOR_ADMIN } from '../../config/environments';
import { Logger } from '../../utils/logger';
import {
  TOKEN_AUTH,
  TOKEN_REFRESH,
  VOUCHER_CREATE,
  VOUCHER_DELETE,
  VOUCHER_UPDATE,
  VOUCHER_CHANNEL_LISTING_UPDATE,
  VOUCHER_CATALOGUES_ADD,
  VOUCHER_CATALOGUES_REMOVE,
} from '../graphql/voucher.mutations';
import {
  GET_CHANNELS,
  GET_PRODUCT_BY_SLUG,
  GET_PRODUCT_BY_ID,
  GET_VOUCHER,
} from '../graphql/voucher.queries';
import {
  UPDATE_METADATA,
  DELETE_METADATA,
} from '../graphql/metadata.mutations';

const logger = Logger.getInstance('SaleorAdminClient');

// Persisted session file — survives between test runs (like storageState.json for browsers)
const SESSION_FILE = path.resolve(__dirname, '../../auth/saleor-admin-session.json');

interface SaleorSession {
  token: string;
  refreshToken: string;
  savedAt: number; // epoch ms
}

function loadSession(): SaleorSession | null {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8')) as SaleorSession;
    }
  } catch {
    // corrupted file — ignore and re-authenticate
  }
  return null;
}

function saveSession(token: string, refreshToken: string): void {
  const dir = path.dirname(SESSION_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ token, refreshToken, savedAt: Date.now() }, null, 2));
  logger.info(`Saleor admin session saved → ${SESSION_FILE}`);
}

// Module-level token cache: one auth per Node.js worker process
let cachedToken: string | null = null;
let cachedChannelId: string | null = null;

export interface SaleorVoucher {
  id: string;
  code: string;
  name: string;
  type: 'ENTIRE_ORDER' | 'SHIPPING' | 'SPECIFIC_PRODUCT';
  discountValueType: 'FIXED' | 'PERCENTAGE';
  applyOncePerOrder: boolean;
  channelListings: SaleorChannelListing[];
}

export interface SaleorChannelListing {
  id: string;
  channel: { id: string; slug: string };
  discountValue: number;
  currency: string;
  minSpent: { amount: number; currency: string } | null;
  minCheckoutItemsQuantity: number | null;
}

export interface VoucherCreateInput {
  name: string;
  code: string;
  type: 'ENTIRE_ORDER' | 'SHIPPING' | 'SPECIFIC_PRODUCT';
  discountValueType: 'FIXED' | 'PERCENTAGE';
  applyOncePerOrder?: boolean;
  applyOncePerCustomer?: boolean;
  usageLimit?: number;
  minCheckoutItemsQuantity?: number;
  startDate?: string;
  endDate?: string;
}

export interface ChannelListingInput {
  channelId: string;
  discountValue: number;
  minAmountSpent?: number;
  minCheckoutItemsQuantity?: number;
}

export interface CatalogueInput {
  products?: string[];
  variants?: string[];
  categories?: string[];
  collections?: string[];
}

export interface SaleorProduct {
  id: string;
  name: string;
  slug: string;
  metadata: { key: string; value: string }[];
  variants: SaleorVariant[];
}

export interface SaleorVariant {
  id: string;
  name: string;
  sku: string;
  metadata: { key: string; value: string }[];
}

export class SaleorAdminClient {
  constructor(private readonly request: APIRequestContext) {}

  // ── Authentication ─────────────────────────────────────────────────────────

  async authenticate(): Promise<void> {
    // 1. Already authenticated this worker process — fast path
    if (cachedToken) return;

    // 2. Try to reuse persisted refresh token (avoids full re-login between runs)
    const session = loadSession();
    if (session?.refreshToken) {
      logger.info('Attempting token refresh from saved session');
      try {
        const refreshed = await this.gql<{
          tokenRefresh: { token: string | null; errors: { field: string; message: string }[] };
        }>(TOKEN_REFRESH, { refreshToken: session.refreshToken });

        if (!refreshed.tokenRefresh.errors?.length && refreshed.tokenRefresh.token) {
          cachedToken = refreshed.tokenRefresh.token;
          // Persist refreshed token + existing refreshToken
          saveSession(cachedToken, session.refreshToken);
          logger.info('Saleor admin token refreshed successfully');
          return;
        }
        logger.warn('Token refresh failed — falling back to full login');
      } catch {
        logger.warn('Token refresh error — falling back to full login');
      }
    }

    // 3. Full login — executes only when no valid session exists
    logger.info(`Authenticating as ${SALEOR_ADMIN.email}`);
    const result = await this.gql<{
      tokenCreate: {
        token: string | null;
        refreshToken: string | null;
        errors: { field: string; message: string }[];
      };
    }>(TOKEN_AUTH, { email: SALEOR_ADMIN.email, password: SALEOR_ADMIN.password });

    if (result.tokenCreate.errors?.length) {
      throw new Error(`Saleor auth failed: ${result.tokenCreate.errors[0].message}`);
    }
    cachedToken = result.tokenCreate.token!;
    saveSession(cachedToken, result.tokenCreate.refreshToken ?? '');
    logger.info('Saleor admin authentication successful — session saved');
  }

  // ── Voucher CRUD ───────────────────────────────────────────────────────────

  async createVoucher(
    input: VoucherCreateInput,
    channelListing: Omit<ChannelListingInput, 'channelId'>,
  ): Promise<SaleorVoucher> {
    await this.authenticate();
    const channelId = await this.getChannelId();

    const voucherInput = {
      ...input,
      addChannels: [
        {
          channelId,
          discountValue: channelListing.discountValue,
          ...(channelListing.minAmountSpent !== undefined && {
            minAmountSpent: channelListing.minAmountSpent,
          }),
          ...(channelListing.minCheckoutItemsQuantity !== undefined && {
            minCheckoutItemsQuantity: channelListing.minCheckoutItemsQuantity,
          }),
        },
      ],
    };

    logger.info(`Creating voucher: ${input.code}`);
    const result = await this.gql<{
      voucherCreate: { voucher: SaleorVoucher; errors: { field: string; message: string }[] };
    }>(VOUCHER_CREATE, { input: voucherInput });

    if (result.voucherCreate.errors?.length) {
      throw new Error(
        `Voucher create failed [${input.code}]: ${result.voucherCreate.errors[0].message}`,
      );
    }
    logger.info(`Voucher created: ${input.code} → ${result.voucherCreate.voucher.id}`);
    return result.voucherCreate.voucher;
  }

  async deleteVoucher(id: string): Promise<void> {
    await this.authenticate();
    logger.info(`Deleting voucher: ${id}`);
    const result = await this.gql<{
      voucherDelete: { errors: { field: string; message: string }[] };
    }>(VOUCHER_DELETE, { id });

    if (result.voucherDelete.errors?.length) {
      logger.warn(`Voucher delete warning [${id}]: ${result.voucherDelete.errors[0].message}`);
    } else {
      logger.info(`Voucher deleted: ${id}`);
    }
  }

  async updateVoucher(id: string, input: Partial<VoucherCreateInput>): Promise<SaleorVoucher> {
    await this.authenticate();
    const result = await this.gql<{
      voucherUpdate: { voucher: SaleorVoucher; errors: { field: string; message: string }[] };
    }>(VOUCHER_UPDATE, { id, input });

    if (result.voucherUpdate.errors?.length) {
      throw new Error(`Voucher update failed: ${result.voucherUpdate.errors[0].message}`);
    }
    return result.voucherUpdate.voucher;
  }

  async updateVoucherChannelListing(
    voucherId: string,
    listing: Omit<ChannelListingInput, 'channelId'>,
  ): Promise<void> {
    await this.authenticate();
    const channelId = await this.getChannelId();

    const result = await this.gql<{
      voucherChannelListingUpdate: { errors: { field: string; message: string }[] };
    }>(VOUCHER_CHANNEL_LISTING_UPDATE, {
      id: voucherId,
      input: {
        addChannels: [
          {
            channelId,
            discountValue: listing.discountValue,
            ...(listing.minAmountSpent !== undefined && { minAmountSpent: listing.minAmountSpent }),
            ...(listing.minCheckoutItemsQuantity !== undefined && {
              minCheckoutItemsQuantity: listing.minCheckoutItemsQuantity,
            }),
          },
        ],
      },
    });

    if (result.voucherChannelListingUpdate.errors?.length) {
      throw new Error(
        `Channel listing update failed: ${result.voucherChannelListingUpdate.errors[0].message}`,
      );
    }
  }

  async addVoucherCatalogues(voucherId: string, input: CatalogueInput): Promise<void> {
    await this.authenticate();
    logger.info(`Adding catalogues to voucher ${voucherId}: ${JSON.stringify(input)}`);
    const result = await this.gql<{
      voucherCataloguesAdd: { errors: { field: string; message: string }[] };
    }>(VOUCHER_CATALOGUES_ADD, { id: voucherId, input });

    if (result.voucherCataloguesAdd.errors?.length) {
      throw new Error(
        `Voucher catalogues add failed: ${result.voucherCataloguesAdd.errors[0].message}`,
      );
    }
  }

  async removeVoucherCatalogues(voucherId: string, input: CatalogueInput): Promise<void> {
    await this.authenticate();
    await this.gql<{ voucherCataloguesRemove: { errors: unknown[] } }>(
      VOUCHER_CATALOGUES_REMOVE,
      { id: voucherId, input },
    );
  }

  // ── Voucher Metadata ───────────────────────────────────────────────────────

  async setVoucherExcludedProducts(
    voucherId: string,
    exclusions: Array<{ productId: string; variantId: string | null }>,
  ): Promise<void> {
    await this.updateMetadata(voucherId, {
      excluded_products: JSON.stringify(exclusions),
    });
    logger.info(`Set excluded_products on voucher ${voucherId}: ${exclusions.length} entries`);
  }

  // ── Object Metadata ────────────────────────────────────────────────────────

  async updateMetadata(id: string, metadata: Record<string, string>): Promise<void> {
    await this.authenticate();
    const input = Object.entries(metadata).map(([key, value]) => ({ key, value }));
    logger.info(`Updating metadata on ${id}: keys=[${Object.keys(metadata).join(', ')}]`);

    const result = await this.gql<{
      updateMetadata: { errors: { field: string; message: string }[] };
    }>(UPDATE_METADATA, { id, input });

    if (result.updateMetadata.errors?.length) {
      throw new Error(`Metadata update failed: ${result.updateMetadata.errors[0].message}`);
    }
  }

  async deleteMetadata(id: string, keys: string[]): Promise<void> {
    await this.authenticate();
    logger.info(`Deleting metadata keys [${keys.join(', ')}] from ${id}`);

    const result = await this.gql<{
      deleteMetadata: { errors: { field: string; message: string }[] };
    }>(DELETE_METADATA, { id, keys });

    if (result.deleteMetadata.errors?.length) {
      logger.warn(`Metadata delete warning: ${result.deleteMetadata.errors[0].message}`);
    }
  }

  async setDiscountEligibility(objectId: string, eligible: boolean): Promise<void> {
    await this.updateMetadata(objectId, { discount_eligible: String(eligible) });
  }

  // ── Product / Variant Lookup ───────────────────────────────────────────────

  async getProductBySlug(slug: string): Promise<SaleorProduct> {
    await this.authenticate();
    const channelSlug = ENV.saleorChannel;
    const result = await this.gql<{
      product: SaleorProduct | null;
    }>(GET_PRODUCT_BY_SLUG, { slug, channel: channelSlug });

    if (!result.product) {
      throw new Error(`Product not found for slug: ${slug}`);
    }
    return result.product;
  }

  async getProductById(id: string): Promise<SaleorProduct> {
    await this.authenticate();
    const channelSlug = ENV.saleorChannel;
    const result = await this.gql<{
      product: SaleorProduct | null;
    }>(GET_PRODUCT_BY_ID, { id, channel: channelSlug });

    if (!result.product) {
      throw new Error(`Product not found for id: ${id}`);
    }
    return result.product;
  }

  async getProductIdBySlug(slug: string): Promise<string> {
    const product = await this.getProductBySlug(slug);
    return product.id;
  }

  async getVariantIdBySlugAndName(productSlug: string, variantName: string): Promise<string> {
    const product = await this.getProductBySlug(productSlug);
    const variant = product.variants.find((v) =>
      v.name.toLowerCase().includes(variantName.toLowerCase()),
    );
    if (!variant) {
      throw new Error(
        `Variant "${variantName}" not found in product "${productSlug}". Available: ${product.variants.map((v) => v.name).join(', ')}`,
      );
    }
    return variant.id;
  }

  async getFirstVariantId(productSlug: string): Promise<string> {
    const product = await this.getProductBySlug(productSlug);
    if (!product.variants.length) {
      throw new Error(`No variants found for product: ${productSlug}`);
    }
    return product.variants[0].id;
  }

  async getVoucher(id: string): Promise<SaleorVoucher> {
    await this.authenticate();
    const result = await this.gql<{ voucher: SaleorVoucher }>(GET_VOUCHER, { id });
    if (!result.voucher) throw new Error(`Voucher not found: ${id}`);
    return result.voucher;
  }

  // ── Channel ────────────────────────────────────────────────────────────────

  async getChannelId(): Promise<string> {
    if (cachedChannelId) return cachedChannelId;
    await this.authenticate();

    const result = await this.gql<{
      channels: { id: string; name: string; slug: string }[];
    }>(GET_CHANNELS);

    const channelName = ENV.saleorChannel;
    const channel = result.channels.find(
      (c) =>
        c.name === channelName ||
        c.slug === channelName.toLowerCase().replace(/\s+/g, '-'),
    );
    if (!channel) {
      throw new Error(
        `Channel "${channelName}" not found. Available: ${result.channels.map((c) => c.name).join(', ')}`,
      );
    }
    cachedChannelId = channel.id;
    logger.info(`Resolved channel "${channelName}" → ${channel.id}`);
    return cachedChannelId;
  }

  // ── Core GraphQL Executor ──────────────────────────────────────────────────

  async gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (cachedToken) {
      headers['Authorization'] = `Bearer ${cachedToken}`;
    }

    const start = Date.now();
    const res = await this.request.post(ENV.saleorGraphQL, {
      headers,
      data: { query, variables },
      timeout: 20000,
    });

    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    logger.api('POST (GraphQL)', ENV.saleorGraphQL, res.status(), Date.now() - start);

    if (json.errors?.length) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`);
    }
    return json.data as T;
  }

  // ── Token reset (for test isolation if needed) ────────────────────────────

  static resetToken(): void {
    cachedToken = null;
    cachedChannelId = null;
  }
}
