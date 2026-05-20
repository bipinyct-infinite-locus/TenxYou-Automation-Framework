import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type Environment = 'staging' | 'production';

const env: Environment = (process.env.ENVIRONMENT as Environment) || 'staging';

const configs = {
  staging: {
    baseURL: process.env.STAGING_BASE_URL || 'https://tenxyou.infinitelocus.com',
    // Backend REST API — serves /saleor/*, /cart/*, /erp/*, /brand-sizes/*
    beApiURL: process.env.BE_API_URL || 'https://api.tenxyou.infinitelocus.com',
    // Legacy alias so resolveURL('/saleor/...') still works in api-client.ts
    saleorApiURL: process.env.BE_API_URL || 'https://api.tenxyou.infinitelocus.com',
    // Saleor GraphQL
    saleorGraphQL: process.env.SALEOR_GRAPHQL_URL || 'https://api.txy-saleor.infinitelocus.com/graphql/',
    saleorChannel: process.env.SALEOR_CHANNEL || 'txy',
    // Strapi CMS
    strapiURL: process.env.STRAPI_BASE_URL || 'https://preprod-strapi.tenxyou.com',
    strapiToken: process.env.STRAPI_TOKEN || '',
    gokwikURL: process.env.GOKWIK_API_URL || 'https://gkx.gokwik.co',
    gokwikMerchantId: process.env.GOKWIK_MERCHANT_ID || '19fo771pq51v',
  },
  production: {
    baseURL: process.env.PRODUCTION_BASE_URL || 'https://tenxyou.com',
    beApiURL: process.env.BE_API_URL_PROD || 'https://api.tenxyou.com',
    saleorApiURL: process.env.BE_API_URL_PROD || 'https://api.tenxyou.com',
    saleorGraphQL: process.env.SALEOR_GRAPHQL_URL_PROD || 'https://api.txy-saleor.tenxyou.com/graphql/',
    saleorChannel: process.env.SALEOR_CHANNEL || 'txy',
    strapiURL: process.env.STRAPI_BASE_URL_PROD || 'https://strapi.tenxyou.com',
    strapiToken: process.env.STRAPI_TOKEN_PROD || '',
    gokwikURL: process.env.GOKWIK_API_URL || 'https://gkx.gokwik.co',
    gokwikMerchantId: process.env.GOKWIK_MERCHANT_ID || '19fo771pq51v',
  },
};

export const ENV = configs[env];
export const CURRENT_ENV = env;

export const DB_CONFIG = {
  host: process.env.DB_HOST || '107.178.113.26',
  port: parseInt(process.env.DB_PORT || '55432'),
  user: process.env.DB_USER || 'saleor',
  password: process.env.DB_PASSWORD || 'saleor',
  database: process.env.DB_NAME || 'saleor',
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
};

export const TIMEOUTS = {
  default: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
  navigation: parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
  api: 15000,
  element: 10000,
};

export const ROUTES = {
  home: '/',
  menPLP: '/gender/men',
  womenPLP: '/gender/women',
  newLaunches: '/new-launches',
  sportShoes: '/sports-shoes',
  sale: '/sale',
  stories: '/neverstopplaying/',
  helpFaq: '/help-faq',
  pdp: (slug: string) => `/product/${slug}`,
  plp: (slug: string) => `/${slug}`,
};

export const API_ENDPOINTS = {
  pdpSlugs: '/api/proxies/pdp-slugs',
  plpSlugs: '/api/proxies/plp-slugs',
  saleorOffers: '/saleor/get-offers',
  saleorNavbar: '/saleor/navbar-data',
  siteContent: '/api/site-content',
};

export const SALEOR_ADMIN = {
  email: process.env.SALEOR_ADMIN_EMAIL || 'admin@saleor.com',
  password: process.env.SALEOR_ADMIN_PASSWORD || 'admin@123',
};

export const CACHE_CONFIG = {
  clearURL:
    process.env.CACHE_CLEAR_URL ||
    'https://api.tenxyou.infinitelocus.com/saleor/clear-cache',
  prefixes: ['p', 'v', 'cache:vouchers'] as const,
  propagationDelay: parseInt(process.env.CACHE_PROPAGATION_DELAY || '3000'),
};

export const LANDING_PAGES = {
  nativeBombayBlue: '/native-bombay-blue',
} as const;

export const CDN_DOMAINS = {
  imageKit: ['ik.imagekit.io', 'imagekit.io'],
  custom: [] as string[],
  blocked: ['s3.amazonaws.com', 'storage.googleapis.com', 's3-ap-south-1.amazonaws.com'],
} as const;
