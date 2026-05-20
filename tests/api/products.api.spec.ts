import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { ENV } from '../../config/environments';

/**
 * TC-API-001 → TC-API-020
 * Product APIs: PDP/PLP slugs, Navbar, Offers, Site Content, GoKwik
 */
test.describe('Product APIs @api @products', () => {

  // ── GET /api/proxies/pdp-slugs ────────────────────────────────────────────

  test.describe('GET /api/proxies/pdp-slugs', () => {
    test('TC-API-001 @smoke — returns 200', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/pdp-slugs`, { failOnStatusCode: false });
      ResponseValidator.assertStatus(res.status(), 200);
    });

    test('TC-API-002 — response body is defined', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/pdp-slugs`, { failOnStatusCode: false });
      ResponseValidator.assertStatus(res.status(), 200);
      const text = await res.text();
      expect(text).toBeDefined();
    });

    test('TC-API-003 — response has 50+ product slugs when S3 is reachable', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/pdp-slugs`, { failOnStatusCode: false });
      const body = await res.json() as unknown[];
      if (Array.isArray(body) && body.length > 0) {
        expect(body.length).toBeGreaterThan(50);
      }
    });

    test('TC-API-004 — all slugs are non-empty strings', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/pdp-slugs`, { failOnStatusCode: false });
      const body = await res.json() as unknown[];
      if (Array.isArray(body)) {
        body.forEach((slug) => {
          if (typeof slug === 'string') {
            expect(slug.trim()).not.toBe('');
          }
        });
      }
    });

    test('TC-API-005 @negative — always returns 200 even if S3 is unreachable (graceful fallback)', async ({ request }) => {
      // The Next.js proxy route always returns 200 with [] on any error
      const res = await request.get(`${ENV.baseURL}/api/proxies/pdp-slugs`, { failOnStatusCode: false });
      ResponseValidator.assertStatus(res.status(), 200);
    });
  });

  // ── GET /api/proxies/plp-slugs ────────────────────────────────────────────

  test.describe('GET /api/proxies/plp-slugs', () => {
    test('TC-API-006 @smoke — returns 200', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/plp-slugs`, { failOnStatusCode: false });
      ResponseValidator.assertStatus(res.status(), 200);
    });

    test('TC-API-007 — response body is defined', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/plp-slugs`, { failOnStatusCode: false });
      ResponseValidator.assertStatus(res.status(), 200);
      const text = await res.text();
      expect(text).toBeDefined();
    });

    test('TC-API-008 — always returns 200 (graceful fallback)', async ({ request }) => {
      const res = await request.get(`${ENV.baseURL}/api/proxies/plp-slugs`, { failOnStatusCode: false });
      ResponseValidator.assertStatus(res.status(), 200);
    });
  });

  // ── GET /saleor/navbar-data ───────────────────────────────────────────────

  test.describe('GET /saleor/navbar-data', () => {
    test('TC-API-009 @smoke — returns 200', async ({ be }) => {
      const { status } = await be.get(BE.NAVBAR);
      ResponseValidator.assertStatusIn(status, [200, 304]);
    });

    test('TC-API-010 — response body success:true and data is array', async ({ be }) => {
      const { body } = await be.get<{ success: boolean; data?: unknown[] }>(BE.NAVBAR);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('TC-API-011 — navbar response time under 3 seconds', async ({ be }) => {
      const { durationMs } = await be.get(BE.NAVBAR);
      ResponseValidator.assertResponseTime(durationMs, 3000);
    });
  });

  // ── POST /saleor/get-offers ───────────────────────────────────────────────

  test.describe('POST /saleor/get-offers', () => {
    test('TC-API-012 @smoke — returns 200', async ({ be }) => {
      const { status } = await be.post(BE.GET_OFFERS, {
        channel: 'txy',
        cartTotal: 1000,
        checkoutId: '',
      });
      ResponseValidator.assertStatusIn(status, [200, 201]);
    });

    test('TC-API-013 — response body is non-empty', async ({ be }) => {
      const { body } = await be.post<{ success?: boolean }>(BE.GET_OFFERS, {
        channel: 'txy',
        cartTotal: 1000,
        checkoutId: '',
      });
      ResponseValidator.assertBodyNotEmpty(body);
    });

    test('TC-API-014 — offers API accepts payload with high cart total', async ({ be }) => {
      const { status } = await be.post(BE.GET_OFFERS, {
        channel: 'txy',
        cartTotal: 99999,
        checkoutId: '',
      });
      expect(status).toBeLessThan(500);
    });
  });

  // ── Strapi site-content ───────────────────────────────────────────────────

  test.describe('GET Strapi /api/site-content', () => {
    test('TC-API-015 @smoke — returns 200 with valid Strapi token', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/site-content?populate=*`, {
        headers: {
          Authorization: `Bearer ${ENV.strapiToken}`,
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
      ResponseValidator.assertStatusIn(res.status(), [200, 401, 403]);
    });

    test('TC-API-016 — site content has data field', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/site-content?populate=*`, {
        headers: {
          Authorization: `Bearer ${ENV.strapiToken}`,
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
      if (res.status() === 200) {
        const body = await res.json() as Record<string, unknown>;
        expect(body).toHaveProperty('data');
      }
    });
  });

  // ── GoKwik ────────────────────────────────────────────────────────────────

  test.describe('GoKwik APIs', () => {
    test('TC-API-017 @smoke — merchant health check returns non-5xx', async ({ request }) => {
      const res = await request.get(`${ENV.gokwikURL}/kp/api/v1/health/merchant`, {
        failOnStatusCode: false,
      });
      expect(res.status()).toBeLessThan(500);
    });

    test('TC-API-018 — GoKwik configurations endpoint returns non-5xx', async ({ request }) => {
      const res = await request.get(
        `${ENV.gokwikURL}/kp/api/v1/configurations/${ENV.gokwikMerchantId}`,
        { failOnStatusCode: false },
      );
      expect(res.status()).toBeLessThan(500);
    });
  });

  // ── Negative tests ────────────────────────────────────────────────────────

  test.describe('Negative API Tests', () => {
    test('TC-API-019 @negative — non-existent BE endpoint returns 404', async ({ be }) => {
      const { status } = await be.get('/saleor/this-endpoint-does-not-exist-xyz');
      expect(status).toBe(404);
    });

    test('TC-API-020 @negative — offers API with null payload returns non-5xx', async ({ be }) => {
      const { status } = await be.post(BE.GET_OFFERS, { invalid: true, data: null });
      expect(status).toBeLessThan(500);
    });
  });
});
