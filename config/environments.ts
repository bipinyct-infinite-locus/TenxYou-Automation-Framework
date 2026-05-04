import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type Environment = 'staging' | 'production';

const env: Environment = (process.env.ENVIRONMENT as Environment) || 'staging';

const configs = {
  staging: {
    baseURL: process.env.STAGING_BASE_URL || 'https://tenxyou.com',
    saleorApiURL: process.env.SALEOR_API_BASE_URL || 'https://api.tenxyou.com',
    saleorGraphQL: process.env.SALEOR_GRAPHQL_URL || 'https://saleor.tenxyou.com/graphql/',
    saleorChannel: process.env.SALEOR_CHANNEL || 'Ten x You Website',
    strapiURL: process.env.STRAPI_BASE_URL || 'https://strapi.tenxyou.com',
    gokwikURL: process.env.GOKWIK_API_URL || 'https://gkx.gokwik.co',
    gokwikMerchantId: process.env.GOKWIK_MERCHANT_ID || '19fo771pq51v',
  },
  production: {
    baseURL: process.env.PRODUCTION_BASE_URL || 'https://tenxyou.infinitelocus.com',
    saleorApiURL: process.env.SALEOR_API_BASE_URL || 'https://api.tenxyou.com',
    saleorGraphQL: process.env.SALEOR_GRAPHQL_URL || 'https://saleor.tenxyou.com/graphql/',
    saleorChannel: process.env.SALEOR_CHANNEL || 'Ten x You Website',
    strapiURL: process.env.STRAPI_BASE_URL || 'https://strapi.tenxyou.com',
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
