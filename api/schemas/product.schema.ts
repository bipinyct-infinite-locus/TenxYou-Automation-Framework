import { Schema } from 'ajv';

export const pdpSlugSchema: Schema = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
  minItems: 1,
};

export const plpSlugSchema: Schema = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
  minItems: 1,
};

export const navbarDataSchema: Schema = {
  type: 'object',
  properties: {
    data: {
      oneOf: [
        { type: 'array' },
        { type: 'object' },
      ],
    },
  },
};

export const offersResponseSchema: Schema = {
  type: 'object',
};

export const siteContentSchema: Schema = {
  type: 'object',
  properties: {
    data: { type: 'object' },
  },
};
