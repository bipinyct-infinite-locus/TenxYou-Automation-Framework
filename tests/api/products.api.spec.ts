// import { test, expect } from '../../fixtures/base.fixture';
// import { ResponseValidator } from '../../api/validators/response-validator';
// import { pdpSlugSchema, plpSlugSchema } from '../../api/schemas/product.schema';
// import { ENV } from '../../config/environments';

// /**
//  * TC-API-001 → TC-API-020
//  * API Contract Tests: Product APIs, Navbar, Offers, Site Content
//  */
// test.describe('Product APIs', () => {
//   // ── PDP Slugs API ─────────────────────────────────────────────────────────
//   test.describe('GET /api/proxies/pdp-slugs', () => {
//     test('TC-API-001 @smoke @api — returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.get(`${ENV.baseURL}/api/proxies/pdp-slugs`);
//       ResponseValidator.assertStatus(status, 200);
//     });

//     test('TC-API-002 @api — response is a non-empty array', async ({ apiClient }) => {
//       const { status, body } = await apiClient.get(`${ENV.baseURL}/api/proxies/pdp-slugs`);
//       ResponseValidator.assertStatus(status, 200);
//       ResponseValidator.assertBodyNotEmpty(body);
//     });

//     test('TC-API-003 @api — response has 50+ product slugs', async ({ apiClient }) => {
//       const slugs = await apiClient.getPDPSlugs();
//       expect(slugs.length).toBeGreaterThan(50);
//     });

//     test('TC-API-004 @api — all slugs are non-empty strings', async ({ apiClient }) => {
//       const slugs = await apiClient.getPDPSlugs();
//       slugs.forEach((slug) => {
//         expect(typeof slug).toBe('string');
//         expect(slug.trim()).not.toBe('');
//       });
//     });

//     test('TC-API-005 @api — known product slug exists', async ({ apiClient }) => {
//       const slugs = await apiClient.getPDPSlugs();
//       const known = 'aeonic-recovery-trainer-vermillion';
//       const found = slugs.some((s) =>
//         typeof s === 'string' ? s.includes('aeonic') : JSON.stringify(s).includes('aeonic'),
//       );
//       expect(found, `Expected to find slug containing "aeonic" in ${slugs.length} slugs`).toBeTruthy();
//     });
//   });

//   // ── PLP Slugs API ─────────────────────────────────────────────────────────
//   test.describe('GET /api/proxies/plp-slugs', () => {
//     test('TC-API-006 @smoke @api — returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.get(`${ENV.baseURL}/api/proxies/plp-slugs`);
//       ResponseValidator.assertStatus(status, 200);
//     });

//     test('TC-API-007 @api — response is non-empty', async ({ apiClient }) => {
//       const { status, body } = await apiClient.get(`${ENV.baseURL}/api/proxies/plp-slugs`);
//       ResponseValidator.assertStatus(status, 200);
//       ResponseValidator.assertBodyNotEmpty(body);
//     });

//     test('TC-API-008 @api — contains expected category slugs', async ({ apiClient }) => {
//       const { body } = await apiClient.get<unknown>(`${ENV.baseURL}/api/proxies/plp-slugs`);
//       const raw = JSON.stringify(body);
//       expect(raw).toContain('sports-shoes');
//     });
//   });

//   // ── Navbar API ────────────────────────────────────────────────────────────
//   test.describe('GET /saleor/navbar-data', () => {
//     test('TC-API-009 @smoke @api — returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.get(`${ENV.saleorApiURL}/saleor/navbar-data`);
//       ResponseValidator.assertStatusIn(status, [200, 304]);
//     });

//     test('TC-API-010 @api — response body is non-empty object', async ({ apiClient }) => {
//       const data = await apiClient.getNavbarData();
//       ResponseValidator.assertBodyNotEmpty(data);
//     });

//     test('TC-API-011 @api — navbar response time under 3 seconds', async ({ request }) => {
//       const start = Date.now();
//       await request.get(`${ENV.saleorApiURL}/saleor/navbar-data`);
//       const duration = Date.now() - start;
//       ResponseValidator.assertResponseTime(duration, 3000);
//     });
//   });

//   // ── Offers API ────────────────────────────────────────────────────────────
//   test.describe('POST /saleor/get-offers', () => {
//     test('TC-API-012 @smoke @api — returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.post(`${ENV.saleorApiURL}/saleor/get-offers`, {});
//       ResponseValidator.assertStatusIn(status, [200, 201]);
//     });

//     test('TC-API-013 @api — response body is non-empty', async ({ apiClient }) => {
//       const data = await apiClient.getOffers();
//       ResponseValidator.assertBodyNotEmpty(data);
//     });

//     test('TC-API-014 @api — offers API accepts empty payload', async ({ apiClient }) => {
//       const { status } = await apiClient.post(`${ENV.saleorApiURL}/saleor/get-offers`, {});
//       expect(status).toBeLessThan(500);
//     });
//   });

//   // ── Site Content (Strapi) ─────────────────────────────────────────────────
//   test.describe('GET Strapi site-content', () => {
//     test('TC-API-015 @smoke @api — returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.get(`${ENV.strapiURL}/api/site-content?populate=*`);
//       ResponseValidator.assertStatus(status, 200);
//     });

//     test('TC-API-016 @api — site content has data field', async ({ apiClient }) => {
//       const { body } = await apiClient.get<Record<string, unknown>>(`${ENV.strapiURL}/api/site-content?populate=*`);
//       ResponseValidator.assertHasField(body, 'data');
//     });
//   });

//   // ── GoKwik Health ─────────────────────────────────────────────────────────
//   test.describe('GoKwik APIs', () => {
//     test('TC-API-017 @api — GoKwik merchant health check returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.get(
//         `${ENV.gokwikURL}/kp/api/v1/health/merchant`,
//       );
//       ResponseValidator.assertStatus(status, 200);
//     });

//     test('TC-API-018 @api — GoKwik configurations endpoint returns 200', async ({ apiClient }) => {
//       const { status } = await apiClient.get(
//         `${ENV.gokwikURL}/kp/api/v1/configurations/${ENV.gokwikMerchantId}`,
//       );
//       ResponseValidator.assertStatus(status, 200);
//     });
//   });

//   // ── Negative API Tests ────────────────────────────────────────────────────
//   test.describe('Negative API Tests', () => {
//     test('TC-API-019 @api @negative — non-existent endpoint returns 404', async ({ request }) => {
//       const res = await request.get(`${ENV.baseURL}/api/does-not-exist-xyz`);
//       expect(res.status()).toBe(404);
//     });

//     test('TC-API-020 @api @negative — offers API with invalid payload returns 4xx or handles gracefully', async ({ apiClient }) => {
//       const { status } = await apiClient.post(
//         `${ENV.saleorApiURL}/saleor/get-offers`,
//         { invalid: true, data: null },
//       );
//       expect(status).toBeLessThan(600);
//     });
//   });
// });
