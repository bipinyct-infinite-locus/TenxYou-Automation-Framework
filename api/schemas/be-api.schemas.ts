/**
 * AJV JSON Schemas for BE REST API responses.
 * Used with ResponseValidator.assertSchema() in all BE API test specs.
 *
 * Pattern: { success: boolean, data: {...}, message?: string }
 */
import { Schema } from 'ajv';

// ── Shared building blocks ────────────────────────────────────────────────────

const pageInfo: Schema = {
  type: 'object',
  properties: {
    hasNextPage: { type: 'boolean' },
    hasPreviousPage: { type: 'boolean' },
    endCursor: { type: ['string', 'null'] },
    startCursor: { type: ['string', 'null'] },
  },
};

// ── Search ────────────────────────────────────────────────────────────────────

export const searchSuggestionSchema: Schema = {
  type: 'object',
  additionalProperties: true,
};

export const wizzySearchSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        products: { type: 'array' },
        totalCount: { type: 'number' },
        searchedKey: { type: 'string' },
        searchResponseId: { type: 'string' },
        facets: { type: 'object' },
      },
    },
  },
};

export const wizzyFilterSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        products: { type: 'array' },
        searchedKey: { type: 'string' },
      },
    },
  },
};

// ── Navbar ────────────────────────────────────────────────────────────────────

export const navbarSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: { type: 'array' },
  },
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersListSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        orders: { type: 'array' },
        pageInfo,
        email: { type: 'string' },
      },
    },
  },
};

export const orderDetailSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        order: { type: 'object' },
      },
    },
  },
};

export const shipmentDetailSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: { type: 'object' },
  },
};

// ── Returns ───────────────────────────────────────────────────────────────────

export const returnReasonsSchema: Schema = {
  oneOf: [
    {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: ['number', 'string'] },
          reason: { type: 'string' },
        },
      },
    },
    {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array' },
      },
    },
  ],
};

export const returnFulfillmentSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
  },
};

export const exchangeRequestSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
  },
};

// ── Cart & Checkout ───────────────────────────────────────────────────────────

export const couponsSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        vouchers: { type: 'array' },
      },
    },
  },
};

export const freebieSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean' },
  },
};

export const cartSyncSchema: Schema = {
  type: 'object',
  additionalProperties: true,
};

export const getCartSchema: Schema = {
  type: 'object',
  additionalProperties: true,
};

// ── Ratings ───────────────────────────────────────────────────────────────────

export const ratingQuestionsSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: { type: 'array' },
  },
};

export const updateRatingSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
  },
};

export const ordersRatingSchema: Schema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        orders: { type: 'array' },
      },
    },
  },
};

// ── User & Fit Finder ─────────────────────────────────────────────────────────

export const editUserSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
  },
};

export const userDetailsSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: { type: 'object' },
  },
};

export const brandsSchema: Schema = {
  type: 'object',
  properties: {
    brands: { type: 'array' },
  },
};

export const brandSizeSchema: Schema = {
  type: 'object',
  additionalProperties: true,
};

export const txySizeSchema: Schema = {
  type: 'object',
  properties: {
    sizes: { type: 'array' },
  },
};

export const shoeFitSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        result: { type: 'object' },
      },
    },
  },
};

export const updateShoeFitSchema: Schema = {
  type: 'object',
  additionalProperties: true,
};

export const notifyMeSchema: Schema = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', enum: [true] },
  },
};

// ── EDD ───────────────────────────────────────────────────────────────────────

export const eddSchema: Schema = {
  type: 'object',
  properties: {
    message: {
      oneOf: [
        { type: 'array' },
        { type: 'object' },
      ],
    },
  },
};
