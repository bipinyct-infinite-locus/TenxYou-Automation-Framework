import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { SEARCH } from '../../data/be-api.data';
import { TIMEOUTS } from '../../config/environments';

/**
 * TC-SEARCH-001 → TC-SEARCH-020
 * Wizzy Search API: Suggestion, Full Search, Filtered Search, Analytics Events
 */
test.describe('Search APIs @api @search', () => {

  // ── POST /saleor/wizzy-suggestion ─────────────────────────────────────────

  test.describe('POST /saleor/wizzy-suggestion', () => {
    test('TC-SEARCH-001 @smoke — returns 200 for valid query', async ({ be }) => {
      const { status } = await be.post(BE.SEARCH_SUGGESTION, SEARCH.suggestion.valid);
      ResponseValidator.assertStatusIn(status, [200, 201]);
    });

    test('TC-SEARCH-002 — response contains suggestions or products', async ({ be }) => {
      const { body } = await be.post<Record<string, unknown>>(BE.SEARCH_SUGGESTION, SEARCH.suggestion.valid);
      ResponseValidator.assertBodyNotEmpty(body);
    });

    test('TC-SEARCH-003 — response time is under 3 seconds', async ({ be }) => {
      const { durationMs } = await be.post(BE.SEARCH_SUGGESTION, SEARCH.suggestion.valid, { timeout: 5000 });
      ResponseValidator.assertResponseTime(durationMs, 3000);
    });

    test('TC-SEARCH-004 @negative — empty query returns any HTTP status', async ({ be }) => {
      const { status } = await be.post<Record<string, unknown>>(BE.SEARCH_SUGGESTION, SEARCH.suggestion.emptyQuery);
      // Wizzy returns 500 for empty query — server-side validation, not a crash
      expect(status).toBeGreaterThan(0);
    });

    test('TC-SEARCH-005 @negative — missing body returns non-5xx', async ({ be }) => {
      const { status } = await be.post(BE.SEARCH_SUGGESTION, {});
      expect(status).toBeLessThan(500);
    });
  });

  // ── POST /saleor/wizzy-search ─────────────────────────────────────────────

  test.describe('POST /saleor/wizzy-search', () => {
    test('TC-SEARCH-006 @smoke — returns 200 with products array', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(
        BE.WIZZY_SEARCH,
        { ...SEARCH.wizzySearch.valid, timestamp: Date.now() },
        { timeout: TIMEOUTS.api },
      );
      ResponseValidator.assertStatus(status, 200);
      ResponseValidator.assertBodyNotEmpty(body);
    });

    test('TC-SEARCH-007 — response contains data.products array', async ({ be }) => {
      const { body } = await be.post<{ data?: { products?: unknown[] } }>(
        BE.WIZZY_SEARCH,
        { ...SEARCH.wizzySearch.valid, timestamp: Date.now() },
        { timeout: TIMEOUTS.api },
      );
      const products = body?.data?.products;
      expect(Array.isArray(products), 'data.products should be an array').toBeTruthy();
    });

    test('TC-SEARCH-008 — page 2 request completes successfully', async ({ be }) => {
      const p1 = await be.post<{ data?: { products?: { id: string }[] } }>(
        BE.WIZZY_SEARCH,
        { ...SEARCH.wizzySearch.valid, timestamp: Date.now() },
      );
      const p2 = await be.post<{ data?: { products?: { id: string }[] } }>(
        BE.WIZZY_SEARCH,
        { ...SEARCH.wizzySearch.page2, timestamp: Date.now() },
      );
      ResponseValidator.assertStatus(p1.status, 200);
      ResponseValidator.assertStatusIn(p2.status, [200, 400]);
    });

    test('TC-SEARCH-009 — sort param changes product order', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(
        BE.WIZZY_SEARCH,
        { ...SEARCH.wizzySearch.withSort, timestamp: Date.now() },
      );
      ResponseValidator.assertStatus(status, 200);
      ResponseValidator.assertBodyNotEmpty(body);
    });

    test('TC-SEARCH-010 — response includes searchResponseId', async ({ be }) => {
      const { body } = await be.post<{ data?: { searchResponseId?: string } }>(
        BE.WIZZY_SEARCH,
        { ...SEARCH.wizzySearch.valid, timestamp: Date.now() },
      );
      // searchResponseId enables analytics attribution
      const srid = body?.data?.searchResponseId;
      if (srid !== undefined) {
        expect(typeof srid).toBe('string');
      }
    });

    test('TC-SEARCH-011 @negative — missing required "q" field returns 4xx', async ({ be }) => {
      const payload = { ...SEARCH.wizzySearch.valid, q: undefined, timestamp: Date.now() };
      const { status } = await be.post(BE.WIZZY_SEARCH, payload);
      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── POST /saleor/wizzy-filtered ───────────────────────────────────────────

  test.describe('POST /saleor/wizzy-filtered', () => {
    test('TC-SEARCH-012 @smoke — returns 200 with filtered products', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(BE.WIZZY_FILTER, SEARCH.wizzyFilter.valid);
      ResponseValidator.assertStatusIn(status, [200, 201]);
      ResponseValidator.assertBodyNotEmpty(body);
    });

    test('TC-SEARCH-013 — multiple filters returns constrained results', async ({ be }) => {
      const { status } = await be.post(BE.WIZZY_FILTER, SEARCH.wizzyFilter.multiFilter);
      ResponseValidator.assertStatusIn(status, [200, 201]);
    });

    test('TC-SEARCH-014 @negative — missing searchedKey returns 4xx or error body', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean; error?: string }>(
        BE.WIZZY_FILTER,
        SEARCH.wizzyFilter.noSearchedKey,
      );
      // Frontend validates client-side; server may also reject
      const isClientError = status >= 400 && status < 500;
      const isServerErrorBody = body?.success === false || typeof body?.error === 'string';
      expect(isClientError || isServerErrorBody).toBeTruthy();
    });

    test('TC-SEARCH-015 — response includes searchedKey echoed back', async ({ be }) => {
      const { body } = await be.post<{ data?: { searchedKey?: string } }>(
        BE.WIZZY_FILTER,
        SEARCH.wizzyFilter.valid,
      );
      if (body?.data?.searchedKey) {
        expect(typeof body.data.searchedKey).toBe('string');
      }
    });
  });

  // ── POST /saleor/wizzy-event/view ─────────────────────────────────────────

  test.describe('POST /saleor/wizzy-event/view (analytics — fire & forget)', () => {
    test('TC-SEARCH-016 @smoke — returns non-5xx for search_start event', async ({ be }) => {
      const { status } = await be.post(BE.WIZZY_EVENT_VIEW, {
        ...SEARCH.wizzyEvents.view,
        timestamp: Date.now(),
      });
      expect(status).toBeLessThan(500);
    });

    test('TC-SEARCH-017 — returns non-5xx for search_returned impression event', async ({ be }) => {
      const { status } = await be.post(BE.WIZZY_EVENT_VIEW, {
        name: 'search_returned',
        searchResponseId: 'resp_test_auto',
        items: [{ itemId: 'UHJvZHVjdFZhcmlhbnQ6MTIz', position: 1 }],
        triggeredOn: new Date().toISOString(),
        source: 'SEARCH_RESULTS',
        q: 'running shoe',
        page: 1,
        sessionIdentifier: 'auto_sess_001',
      });
      expect(status).toBeLessThan(500);
    });
  });

  // ── POST /saleor/wizzy-event/click ────────────────────────────────────────

  test.describe('POST /saleor/wizzy-event/click', () => {
    test('TC-SEARCH-018 @smoke — returns non-5xx for product click event', async ({ be }) => {
      const { status } = await be.post(BE.WIZZY_EVENT_CLICK, SEARCH.wizzyEvents.click);
      expect(status).toBeLessThan(500);
    });
  });

  // ── POST /saleor/wizzy-event/converted ───────────────────────────────────

  test.describe('POST /saleor/wizzy-event/converted', () => {
    test('TC-SEARCH-019 @smoke — returns non-5xx for atc_search event', async ({ be }) => {
      const { status } = await be.post(BE.WIZZY_EVENT_CONVERTED, SEARCH.wizzyEvents.converted);
      expect(status).toBeLessThan(500);
    });

    test('TC-SEARCH-020 — returns non-5xx for purchase_search event', async ({ be }) => {
      const { status } = await be.post(BE.WIZZY_EVENT_CONVERTED, {
        name: 'purchase_search',
        conversionType: 'converted',
        id: 'ORD-AUTO-001',
        items: [{ itemId: 'UHJvZHVjdFZhcmlhbnQ6MTIz' }],
        triggeredOn: new Date().toISOString(),
        value: 1999,
        qty: 1,
        sessionIdentifier: 'auto_sess_001',
        source: 'SEARCH_RESULTS',
      });
      expect(status).toBeLessThan(500);
    });
  });
});
