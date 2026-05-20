import { APIRequestContext } from '@playwright/test';
import { ENV } from '../../config/environments';
import { Logger } from '../../utils/logger';
import { BASE_COLOR_NAMES, BaseColorName } from '../../data/filters.data';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetadataEntry {
  key: string;
  value: string;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; locations?: unknown }>;
}

export interface ColorMappings {
  /** base color name → hex code (e.g. Black → #000000) */
  swatchMapping: Partial<Record<BaseColorName, string>>;
  /** base color name → raw product color values */
  filterMapping: Partial<Record<BaseColorName, string[]>>;
}

// ── GraphQL Query ─────────────────────────────────────────────────────────────
// Both mappings are stored in Saleor shop metadata and fetched in one call.
// The FE calls this once per PLP session load (PRD §FE Responsibilities).
const SHOP_METADATA_QUERY = `
  query GetColorMappings {
    shop {
      metadata { key value }
    }
  }
`;

// ── Helper Class ──────────────────────────────────────────────────────────────

export class FilterApiHelper {
  private readonly logger = Logger.getInstance('FilterApiHelper');

  constructor(private readonly request: APIRequestContext) {}

  /**
   * Fetches both ColorSwatchMapping and ColorFilterMapping in a single GraphQL
   * request, mirroring the FE's batched call behaviour (PRD §FE Responsibilities).
   */
  async fetchBothMappingsInBatch(): Promise<ColorMappings> {
    const start = Date.now();
    const { status, body } = await this.postGraphQL<{ shop: { metadata: MetadataEntry[] } }>(
      SHOP_METADATA_QUERY,
    );
    this.logger.api('POST', `${ENV.saleorGraphQL} [batched mappings]`, status, Date.now() - start);

    const metadata: MetadataEntry[] = body.data?.shop?.metadata ?? [];
    return {
      swatchMapping: this.buildSwatchMap(metadata),
      filterMapping: this.buildFilterMap(metadata),
    };
  }

  async fetchColorSwatchMapping(): Promise<Partial<Record<BaseColorName, string>>> {
    const { swatchMapping } = await this.fetchBothMappingsInBatch();
    return swatchMapping;
  }

  async fetchColorFilterMapping(): Promise<Partial<Record<BaseColorName, string[]>>> {
    const { filterMapping } = await this.fetchBothMappingsInBatch();
    return filterMapping;
  }

  /**
   * Low-level GraphQL POST — exposed so spec files can verify raw HTTP behaviour.
   */
  async postGraphQL<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<{ status: number; body: GraphQLResponse<T> }> {
    const start = Date.now();
    const res = await this.request.post(ENV.saleorGraphQL, {
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      data:    { query, variables },
      timeout: 15_000,
    });
    const body = (await res.json().catch(() => ({}))) as GraphQLResponse<T>;
    this.logger.api('POST', ENV.saleorGraphQL, res.status(), Date.now() - start);
    return { status: res.status(), body };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Entries whose value starts with '#' are swatch hex codes. */
  private buildSwatchMap(metadata: MetadataEntry[]): Partial<Record<BaseColorName, string>> {
    return metadata
      .filter(
        ({ key, value }) =>
          (BASE_COLOR_NAMES as readonly string[]).includes(key) && value.startsWith('#'),
      )
      .reduce<Partial<Record<BaseColorName, string>>>((acc, { key, value }) => {
        acc[key as BaseColorName] = value;
        return acc;
      }, {});
  }

  /** Entries whose value does NOT start with '#' are raw product color labels. */
  private buildFilterMap(metadata: MetadataEntry[]): Partial<Record<BaseColorName, string[]>> {
    return metadata
      .filter(
        ({ key, value }) =>
          (BASE_COLOR_NAMES as readonly string[]).includes(key) && !value.startsWith('#'),
      )
      .reduce<Partial<Record<BaseColorName, string[]>>>((acc, { key, value }) => {
        const colorKey = key as BaseColorName;
        if (!acc[colorKey]) acc[colorKey] = [];
        if (!acc[colorKey]!.includes(value)) acc[colorKey]!.push(value);
        return acc;
      }, {});
  }
}
