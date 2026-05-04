import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const env = process.env.ENVIRONMENT || 'staging';
const baseURL =
  env === 'production'
    ? process.env.PRODUCTION_BASE_URL!
    : process.env.STAGING_BASE_URL!;

export const STORAGE_STATE = path.resolve(__dirname, 'auth/storageState.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : parseInt(process.env.RETRIES || '1'),
  workers: process.env.CI ? 2 : parseInt(process.env.WORKERS || '1'),
  timeout: parseInt(process.env.DEFAULT_TIMEOUT || '60000'),
  expect: {
    timeout: 10000,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true }],
  ],

  use: {
    baseURL,
    headless: process.env.HEADLESS !== 'false',
    navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    actionTimeout: 15000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en;q=0.9',
    },
    viewport: { width: 1600, height: 850 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Auth setup — runs first to populate storageState.json
    {
      name: 'auth-setup',
      testDir: './auth',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 850 } },
    },

    // Main browser projects — all depend on auth
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 850 },
        storageState: STORAGE_STATE,
      },
      dependencies: ['auth-setup'],
    },
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: STORAGE_STATE,
    //   },
    //   dependencies: ['auth-setup'],
    // },
    // {
    //   name: 'mobile-chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: STORAGE_STATE,
    //   },
    //   dependencies: ['auth-setup'],
    // },

    // API tests — no browser needed
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL },
    },
  ],
});
