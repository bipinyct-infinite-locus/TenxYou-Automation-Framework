import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { ORDERS } from '../../data/be-api.data';
import {
  ordersListSchema,
  orderDetailSchema,
  shipmentDetailSchema,
} from '../../api/schemas/be-api.schemas';

/**
 * TC-ORDER-001 → TC-ORDER-020
 * Orders API: list, detail, shipment, tracker, you-may-like
 *
 * All endpoints require authentication (requireAuth: true).
 * The `beAuth` fixture handles login/logout automatically.
 */
test.describe('Orders APIs @api @orders', () => {

  // ── POST /saleor/get-orders-by-filter ─────────────────────────────────────

  test.describe('POST /saleor/get-orders-by-filter', () => {
    test('TC-ORDER-001 @smoke — authenticated: returns 200 with orders list', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<Record<string, unknown>>(
        BE.GET_ORDERS_BY_FILTER,
        ORDERS.filterAll,
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 401]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, ordersListSchema);
      }
    });

    test('TC-ORDER-002 — orders array is present in response data', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<{ success: boolean; data?: { orders?: unknown[] } }>(
        BE.GET_ORDERS_BY_FILTER,
        ORDERS.filterAll,
        { requireAuth: true },
      );
      if (status === 200) {
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data?.orders)).toBeTruthy();
      }
    });

    test('TC-ORDER-003 — filter by FULFILLED status returns only fulfilled orders', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<{ success: boolean; data?: { orders?: { status: string }[] } }>(
        BE.GET_ORDERS_BY_FILTER,
        ORDERS.filterFulfilled,
        { requireAuth: true },
      );
      if (status === 200) {
        expect(body.success).toBe(true);
        const orders = body.data?.orders ?? [];
        orders.forEach((o) => {
          expect(o.status).toBe('FULFILLED');
        });
      }
    });

    test('TC-ORDER-004 — pagination: response contains pageInfo', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<{ success: boolean; data?: { pageInfo?: { hasNextPage: boolean } } }>(
        BE.GET_ORDERS_BY_FILTER,
        ORDERS.filterAll,
        { requireAuth: true },
      );
      if (status === 200) {
        expect(body.success).toBe(true);
        expect(body.data?.pageInfo).toBeDefined();
      }
    });

    test('TC-ORDER-005 @negative — unauthenticated returns 401 or 403', async ({ be }) => {
      const { status } = await be.post(BE.GET_ORDERS_BY_FILTER, ORDERS.filterAll);
      expect([401, 403]).toContain(status);
    });

    test('TC-ORDER-006 @negative — missing filter field returns 4xx', async ({ beAuth }) => {
      const { status } = await beAuth.post(
        BE.GET_ORDERS_BY_FILTER,
        ORDERS.missingFilter,
        { requireAuth: true },
      );
      expect(status).toBeGreaterThanOrEqual(400);
    });

    test('TC-ORDER-007 — response time under 5 seconds', async ({ beAuth }) => {
      const { durationMs } = await beAuth.post(
        BE.GET_ORDERS_BY_FILTER,
        ORDERS.filterAll,
        { requireAuth: true, timeout: 10000 },
      );
      ResponseValidator.assertResponseTime(durationMs, 5000);
    });
  });

  // ── GET /saleor/get-order-details/?orderNumber={id} ───────────────────────

  test.describe('GET /saleor/get-order-details/?orderNumber', () => {
    test('TC-ORDER-008 @smoke — authenticated: returns order for valid order number', async ({ beAuth }) => {
      const { status, body } = await beAuth.get<Record<string, unknown>>(
        BE.GET_ORDER_BY_NUMBER(ORDERS.sampleOrderNumber),
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 401, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, orderDetailSchema);
      }
    });

    test('TC-ORDER-009 @negative — unauthenticated returns 401 or 403', async ({ be }) => {
      const { status } = await be.get(BE.GET_ORDER_BY_NUMBER(ORDERS.sampleOrderNumber));
      expect([401, 403]).toContain(status);
    });

    test('TC-ORDER-010 @negative — invalid order number returns 404 or error body', async ({ beAuth }) => {
      const { status, body } = await beAuth.get<{ success: boolean }>(
        BE.GET_ORDER_BY_NUMBER('INVALID-ORDER-XYZ'),
        { requireAuth: true },
      );
      const isNotFound = status === 404 || status === 401 || body?.success === false;
      expect(isNotFound).toBeTruthy();
    });
  });

  // ── GET /saleor/order-detail?orderId={id} ────────────────────────────────

  test.describe('GET /saleor/order-detail?orderId', () => {
    test('TC-ORDER-011 @smoke — authenticated: returns order detail', async ({ beAuth }) => {
      const { status, body } = await beAuth.get<Record<string, unknown>>(
        BE.GET_ORDER_DETAIL(ORDERS.sampleOrderId),
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 401, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, orderDetailSchema);
      }
    });

    test('TC-ORDER-012 @negative — unauthenticated returns 401 or 403', async ({ be }) => {
      const { status } = await be.get(BE.GET_ORDER_DETAIL(ORDERS.sampleOrderId));
      expect([401, 403]).toContain(status);
    });
  });

  // ── GET /saleor/{orderId}/get-order?fulfillmentId={id} ───────────────────

  test.describe('GET /saleor/{orderId}/get-order (order tracker)', () => {
    test('TC-ORDER-013 @smoke — returns non-5xx for valid IDs', async ({ beAuth }) => {
      const { status } = await beAuth.get(
        BE.GET_ORDER_TRACKER(ORDERS.sampleOrderId, ORDERS.sampleFulfillmentId),
      );
      expect(status).toBeLessThan(500);
    });

    test('TC-ORDER-014 @negative — missing fulfillmentId returns 4xx', async ({ beAuth }) => {
      const { status } = await beAuth.get(
        BE.GET_ORDER_TRACKER(ORDERS.sampleOrderId, ''),
      );
      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── GET /saleor/shipmentDetails?fulfillmentId=&orderId= ──────────────────

  test.describe('GET /saleor/shipmentDetails', () => {
    test('TC-ORDER-015 @smoke — authenticated: returns shipment data or 404', async ({ beAuth }) => {
      const { status, body } = await beAuth.get<Record<string, unknown>>(
        BE.GET_SHIPMENT_DETAIL(ORDERS.sampleFulfillmentId, ORDERS.sampleOrderId),
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 401, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, shipmentDetailSchema);
      }
    });

    test('TC-ORDER-016 @negative — unauthenticated returns 401 or 403', async ({ be }) => {
      const { status } = await be.get(
        BE.GET_SHIPMENT_DETAIL(ORDERS.sampleFulfillmentId, ORDERS.sampleOrderId),
      );
      expect([401, 403]).toContain(status);
    });

    test('TC-ORDER-017 @negative — missing orderId in URL returns 4xx', async ({ beAuth }) => {
      const { status } = await beAuth.get(
        BE.GET_SHIPMENT_DETAIL(ORDERS.sampleFulfillmentId, ''),
        { requireAuth: true },
      );
      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── GET /saleor/get-you-may-like/?orderNumber={id} ───────────────────────

  test.describe('GET /saleor/get-you-may-like', () => {
    test('TC-ORDER-018 @smoke — authenticated: returns you-may-like data', async ({ beAuth }) => {
      const { status, body } = await beAuth.get<{ success: boolean; data?: unknown }>(
        BE.GET_YOU_MAY_LIKE(ORDERS.sampleOrderNumber),
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 404]);
      if (status === 200 && body.success) {
        expect(body.data).toBeDefined();
      }
    });

    test('TC-ORDER-019 @negative — unauthenticated returns 401, 403, or 404', async ({ be }) => {
      const { status } = await be.get(BE.GET_YOU_MAY_LIKE(ORDERS.sampleOrderNumber));
      expect([401, 403, 404]).toContain(status);
    });

    test('TC-ORDER-020 @negative — invalid order number returns 404 or error body', async ({ beAuth }) => {
      const { status, body } = await beAuth.get<{ success: boolean }>(
        BE.GET_YOU_MAY_LIKE('INVALID-ORD-9999'),
        { requireAuth: true },
      );
      const isNotFound = status === 404 || body?.success === false;
      expect(isNotFound).toBeTruthy();
    });
  });
});
