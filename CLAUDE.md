# TenxYou Automation Framework

## Project Overview

Production-grade Playwright TypeScript automation framework for **TenxYou** — an Indian e-commerce platform for sportswear. Tests the full shopping journey: homepage, PLP, PDP, cart, checkout, search, wishlist, profile, APIs, and end-to-end purchase flows.

- **Framework**: Playwright 1.44.0 + TypeScript 5.4.5
- **Backend**: Saleor (GraphQL) + Strapi (CMS)
- **Auth**: GoKwik OTP-based login with session reuse
- **Database**: PostgreSQL (Saleor backend, direct via `pg`)
- **Reporting**: Allure 3.0.0 + HTML + JSON
- **Logging**: Winston (singleton logger)

---

## Directory Structure

```
├── auth/
│   └── auth.setup.ts          # One-time OTP login; saves session to auth/storageState.json
├── config/
│   └── environments.ts        # Staging/production URLs, API endpoints, timeouts
├── pages/                     # 9 POM classes (base, home, plp, pdp, cart, checkout, search, wishlist, profile)
├── fixtures/
│   ├── base.fixture.ts        # Extended test fixture — injects all page objects + apiClient + db
│   └── auth.fixture.ts
├── api/
│   ├── client/api-client.ts   # APIClient (GET/POST/PUT/DELETE + convenience methods)
│   ├── validators/            # Response validation
│   └── schemas/               # JSON schemas (AJV)
├── utils/
│   ├── logger.ts              # Winston singleton (info/warn/error/debug/api)
│   ├── wait.util.ts           # Smart waits (networkIdle, DOM, element, URL, retry)
│   ├── faker.util.ts          # Test data generation
│   ├── network.util.ts        # Network capture/mocking
│   └── db.util.ts             # PostgreSQL pool helpers
├── data/
│   ├── users.data.ts          # TEST_USERS, TEST_ADDRESSES
│   └── products.data.ts       # PRODUCTS (cricket/lifestyle/running), COUPONS
├── tests/
│   ├── home/                  # TC-HOME-001 to TC-HOME-014
│   ├── plp/                   # PLP filtering, sorting, pagination
│   ├── pdp/                   # PDP details, add to cart, wishlist
│   ├── cart/                  # TC-CART-001 to TC-CART-015 (add/remove/qty/coupons)
│   ├── checkout/              # Checkout flow (address, shipping, payment)
│   ├── search/                # Search functionality
│   ├── wishlist/              # Wishlist operations
│   ├── api/                   # API contract tests
│   └── e2e/                   # TC-E2E-001 to TC-E2E-005 (Browse→PDP→Cart→Checkout)
├── docs/
│   ├── EXECUTION_GUIDE.md     # Setup & run instructions
│   ├── test-cases.md          # TC-* mappings
│   ├── api-catalog.json       # API endpoints
│   └── sitemap.json           # Site structure/routes
├── crawl/                     # Website snapshots (homepage, PLP, PDP)
├── .env                       # Environment variables
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables (`.env`)

```env
ENVIRONMENT=staging
STAGING_BASE_URL=https://tenxyou.com
PRODUCTION_BASE_URL=https://tenxyou.infinitelocus.com
SALEOR_API_BASE_URL=https://api.tenxyou.com
SALEOR_GRAPHQL_URL=https://saleor.tenxyou.com/graphql/
SALEOR_CHANNEL=Ten x You Website
STRAPI_BASE_URL=https://strapi.tenxyou.com
GOKWIK_API_URL=https://gkx.gokwik.co
GOKWIK_MERCHANT_ID=19fo771pq51v
AUTH_PHONE=9999999999
STORAGE_STATE_PATH=auth/storageState.json
DB_HOST=107.178.113.26
DB_PORT=55432
DB_USER=saleor / DB_PASSWORD=saleor / DB_NAME=saleor
HEADLESS=true / SLOW_MO=0
DEFAULT_TIMEOUT=90000 / NAVIGATION_TIMEOUT=60000
RETRIES=0 / WORKERS=1
```

---

## TypeScript Path Aliases

```json
"@config"    → ./config
"@pages"     → ./pages
"@api"       → ./api
"@utils"     → ./utils
"@data"      → ./data
"@fixtures"  → ./fixtures
```

---

## NPM Scripts

```bash
npm test                  # All tests (chromium)
npm run test:staging      # Staging environment
npm run test:prod         # Production environment
npm run test:smoke        # @smoke tagged tests (~22 tests)
npm run test:regression   # Full regression suite
npm run test:ui           # Playwright UI mode
npm run test:headed       # Headed browser mode
npm run test:home         # Homepage suite only
npm run test:plp          # PLP suite only
npm run test:pdp          # PDP suite only
npm run test:cart         # Cart suite only
npm run test:checkout     # Checkout suite only
npm run test:search       # Search suite only
npm run test:api          # API contract tests
npm run test:e2e          # End-to-end flows
npm run report            # Open HTML report
npm run report:allure     # Open Allure report
```

---

## Playwright Config Highlights

- `testDir: ./tests`, `fullyParallel: true`
- `retries: CI ? 2 : 1`, `workers: CI ? 2 : 1`
- `timeout: 60000`, `expect.timeout: 10000`
- **Projects**: `auth-setup` → `chromium` (depends on auth-setup) → `api` (no browser)
- `storageState: 'auth/storageState.json'` reused by all browser tests
- Reporters: `list`, `html`, `json`, `allure-playwright`
- Viewport: `1600x850`, headless, screenshots on failure

---

## Authentication

GoKwik OTP-based login — **one-time manual setup**:

```bash
npx playwright test auth/auth.setup.ts --project=auth-setup --headed
# Enter OTP manually → session saved to auth/storageState.json
```

All subsequent runs reuse the saved session. If session expires, re-run the above. For CI: commit `auth/storageState.json` as a secret/artifact.

---

## Page Object Model Pattern

All pages extend `BasePage` (common header/footer/nav locators + actions + assertions).

```typescript
// Use fixture injection — never instantiate pages manually
test('TC-HOME-001 @smoke — homepage loads', async ({ homePage }) => {
  await homePage.load()
  await homePage.assertHeroVisible()
})
```

Available fixtures: `homePage`, `plpPage`, `pdpPage`, `cartPage`, `checkoutPage`, `searchPage`, `wishlistPage`, `profilePage`, `apiClient`, `db`

---

## Test Naming Convention

```
TC-[FEATURE]-[NUMBER] @tag — description
```

Tags: `@smoke`, `@sanity`, `@regression`, `@e2e`, `@api`, `@negative`, `@edge`

Examples:
- `TC-HOME-001 @smoke`
- `TC-CART-005 @regression`
- `TC-E2E-001 @smoke @e2e`

---

## API Client Usage

```typescript
// In tests via fixture
const { status, body } = await apiClient.getPDPSlugs()
const { status, body } = await apiClient.get('/some-endpoint')
const { status, body } = await apiClient.post('/endpoint', { data })
// Resolves to Saleor, Strapi, or base URL automatically
```

---

## Database Helpers (`db` fixture)

```typescript
await db.getProductBySlug('nike-cricket')
await db.getCouponByCode('FLAT200')
await db.getOrderByEmail('test@automation.test')
await db.getWishlistItems(userId)
await db.cleanupTestOrders('test@automation.test')
```

---

## Known Constraints

| Constraint | Mitigation |
|---|---|
| GoKwik OTP required | Session reuse via `storageState.json` |
| Staging data unstable | Dynamic slugs fetched via `apiClient` |
| OTP payment not automatable | E2E tests stop at checkout initiation |
| Search 1.5s debounce | `SearchPage.search()` includes 1.5s delay |
| Next.js RSC navigation | Use `waitForLoadState('domcontentloaded')` |

---

## CI/CD

GitHub Actions not yet configured. When adding:
- Node 18+, npm 9+
- `npx playwright install --with-deps`
- Provide `auth/storageState.json` as CI secret
- Use `npm run test:smoke` for PR checks, `test:regression` for nightly
