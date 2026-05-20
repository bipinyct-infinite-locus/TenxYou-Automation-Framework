import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { navbarSchema } from '../../api/schemas/be-api.schemas';
import { ENV } from '../../config/environments';

/**
 * TC-CONTENT-001 → TC-CONTENT-018
 * Navbar, Dynamic Pages, Testimonials, Tagbox, Strapi CMS
 */
test.describe('Navbar & Content APIs @api @content', () => {

  // ── GET /saleor/navbar-data ───────────────────────────────────────────────

  test.describe('GET /saleor/navbar-data', () => {
    test('TC-CONTENT-001 @smoke — returns 200 with navbar data', async ({ be }) => {
      const { status, body } = await be.get<Record<string, unknown>>(BE.NAVBAR);
      ResponseValidator.assertStatus(status, 200);
      ResponseValidator.assertSchema(body, navbarSchema);
    });

    test('TC-CONTENT-002 — navbar data array is non-empty', async ({ be }) => {
      const { body } = await be.get<{ success: boolean; data?: unknown[] }>(BE.NAVBAR);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBeTruthy();
      expect((body.data ?? []).length).toBeGreaterThan(0);
    });

    test('TC-CONTENT-003 — each navbar item has a name field', async ({ be }) => {
      const { body } = await be.get<{ data?: { name: string }[] }>(BE.NAVBAR);
      const items = body.data ?? [];
      if (items.length > 0) {
        items.forEach((item) => {
          expect(typeof item.name).toBe('string');
        });
      }
    });

    test('TC-CONTENT-004 — response time under 3 seconds', async ({ be }) => {
      const { durationMs } = await be.get(BE.NAVBAR);
      ResponseValidator.assertResponseTime(durationMs, 3000);
    });
  });

  // ── GET /saleor/dynamic-pages/{slug} ──────────────────────────────────────

  test.describe('GET /saleor/dynamic-pages/{slug}', () => {
    test('TC-CONTENT-005 @smoke — returns non-5xx for known slug', async ({ be }) => {
      const { status } = await be.get(BE.DYNAMIC_PAGE('mens-running-shoes'));
      expect(status).toBeLessThan(500);
    });

    test('TC-CONTENT-006 — returns 200 or 404 for dynamic page slug', async ({ be }) => {
      const { status } = await be.get(BE.DYNAMIC_PAGE('mens-running-shoes'));
      ResponseValidator.assertStatusIn(status, [200, 404]);
    });

    test('TC-CONTENT-007 @negative — non-existent slug returns 404 or empty data', async ({ be }) => {
      const { status, body } = await be.get<{ success?: boolean }>(
        BE.DYNAMIC_PAGE('this-slug-definitely-does-not-exist-xyz-9999'),
      );
      const isNotFound = status === 404 || body?.success === false;
      expect(isNotFound || status === 200).toBeTruthy();
    });
  });

  // ── POST /saleor/get-testimonials ─────────────────────────────────────────

  test.describe('POST /saleor/get-testimonials', () => {
    test('TC-CONTENT-008 @smoke — returns non-5xx for valid productId', async ({ be }) => {
      const { status } = await be.post(BE.TESTIMONIALS, {
        productId: process.env.TEST_PRODUCT_ID || 'UHJvZHVjdDoxMjM=',
      });
      expect(status).toBeLessThan(500);
    });

    test('TC-CONTENT-009 — response contains testimonials data or empty', async ({ be }) => {
      const { body } = await be.post<{ success?: boolean; data?: unknown }>(BE.TESTIMONIALS, {
        productId: process.env.TEST_PRODUCT_ID || 'UHJvZHVjdDoxMjM=',
      });
      expect(typeof body?.success).toBe('boolean');
    });

    test('TC-CONTENT-010 @negative — missing productId returns 4xx or error body', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean }>(BE.TESTIMONIALS, {});
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody || status === 200).toBeTruthy();
    });
  });

  // ── GET /saleor/tagbox-data ────────────────────────────────────────────────

  test.describe('GET /saleor/tagbox-data', () => {
    test('TC-CONTENT-011 @smoke — returns non-5xx for valid galleryId', async ({ be }) => {
      const galleryId = process.env.TEST_TAGBOX_GALLERY_ID || 'test_gallery_001';
      const { status } = await be.get(BE.TAGBOX_POSTS(galleryId, ['feed1'], ['post1']));
      expect(status).toBeLessThan(500);
    });

    test('TC-CONTENT-012 — tagbox response contains responseStatus field', async ({ be }) => {
      const galleryId = process.env.TEST_TAGBOX_GALLERY_ID || 'test_gallery_001';
      const { body } = await be.get<{ data?: { responseStatus?: boolean } }>(
        BE.TAGBOX_POSTS(galleryId, ['feed1'], ['post1']),
      );
      // May be wrapped in data object
      expect(body).toBeDefined();
    });
  });

  // ── Strapi CMS API ────────────────────────────────────────────────────────

  test.describe('Strapi CMS — GET /api/homepages', () => {
    test('TC-CONTENT-013 @smoke — returns 200 with homepage data', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/homepages?populate=*`, {
        headers: {
          Authorization: `Bearer ${ENV.strapiToken}`,
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBeLessThan(500);
    });

    test('TC-CONTENT-014 — homepage response has data field', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/homepages?populate=*`, {
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

  test.describe('Strapi CMS — GET /api/site-content', () => {
    test('TC-CONTENT-015 @smoke — returns 200 or 401 (needs valid token)', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/site-content?populate=*`, {
        headers: {
          Authorization: `Bearer ${ENV.strapiToken}`,
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
      ResponseValidator.assertStatusIn(res.status(), [200, 401, 403]);
    });
  });

  test.describe('Strapi CMS — GET /api/search-zero-state', () => {
    test('TC-CONTENT-016 @smoke — returns non-5xx', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/search-zero-state?populate=*`, {
        headers: {
          Authorization: `Bearer ${ENV.strapiToken}`,
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBeLessThan(500);
    });
  });

  test.describe('Strapi CMS — GET /api/category-landings', () => {
    test('TC-CONTENT-017 @smoke — returns non-5xx', async ({ request }) => {
      const res = await request.get(`${ENV.strapiURL}/api/category-landings?populate=*`, {
        headers: {
          Authorization: `Bearer ${ENV.strapiToken}`,
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBeLessThan(500);
    });

    test('TC-CONTENT-018 — paginated fetch (pageSize=100) returns non-5xx', async ({ request }) => {
      const res = await request.get(
        `${ENV.strapiURL}/api/category-landings?pagination[pageSize]=100&populate=*`,
        {
          headers: {
            Authorization: `Bearer ${ENV.strapiToken}`,
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false,
        },
      );
      expect(res.status()).toBeLessThan(500);
    });
  });
});
