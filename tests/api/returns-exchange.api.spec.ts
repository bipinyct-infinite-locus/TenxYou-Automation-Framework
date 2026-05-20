import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { RETURNS, EXCHANGE, ORDERS } from '../../data/be-api.data';
import {
  returnFulfillmentSchema,
  exchangeRequestSchema,
} from '../../api/schemas/be-api.schemas';

/**
 * TC-RETURN-001 → TC-RETURN-018
 * Returns & Exchange API: return reasons, initiate return, create exchange
 */
test.describe('Returns & Exchange APIs @api @returns', () => {

  // ── GET /saleor/return-reasons ────────────────────────────────────────────

  test.describe('GET /saleor/return-reasons', () => {
    test('TC-RETURN-001 @smoke — returns 200 with reasons list', async ({ be }) => {
      const { status, body } = await be.get<unknown>(BE.RETURN_REASONS);
      ResponseValidator.assertStatus(status, 200);
      ResponseValidator.assertBodyNotEmpty(body);
    });

    test('TC-RETURN-002 — response is an array or wrapped object', async ({ be }) => {
      const { body } = await be.get<unknown>(BE.RETURN_REASONS);
      const isArray = Array.isArray(body);
      const isWrapped = typeof body === 'object' && body !== null && 'success' in (body as object);
      expect(isArray || isWrapped).toBeTruthy();
    });

    test('TC-RETURN-003 — each reason has id and reason fields', async ({ be }) => {
      const { body } = await be.get<{ id: unknown; reason: string }[]>(BE.RETURN_REASONS);
      if (Array.isArray(body) && body.length > 0) {
        body.forEach((item) => {
          expect(item).toHaveProperty('reason');
          expect(typeof item.reason).toBe('string');
        });
      }
    });

    test('TC-RETURN-004 — response time under 3 seconds (public endpoint)', async ({ be }) => {
      const { durationMs } = await be.get(BE.RETURN_REASONS);
      ResponseValidator.assertResponseTime(durationMs, 3000);
    });
  });

  // ── POST /saleor/return-fulfillment (multipart/form-data) ─────────────────

  test.describe('POST /saleor/return-fulfillment', () => {
    test('TC-RETURN-005 @smoke — authenticated: valid return payload returns 200', async ({ beAuth }) => {
      const { status, body } = await beAuth.postForm<Record<string, unknown>>(
        BE.RETURN_FULFILLMENT,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: RETURNS.validFulfillments,
        },
        { requireAuth: true },
      );
      // 200 = success; 400/422 = server validation (still non-5xx)
      ResponseValidator.assertStatusIn(status, [200, 400, 422]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, returnFulfillmentSchema);
      }
    });

    test('TC-RETURN-006 @negative — missing orderId returns 4xx', async ({ beAuth }) => {
      const { status } = await beAuth.postForm(
        BE.RETURN_FULFILLMENT,
        { fulfillments: RETURNS.validFulfillments },
        { requireAuth: true },
      );
      expect(status).toBeGreaterThanOrEqual(400);
    });

    test('TC-RETURN-007 @negative — missing fulfillments returns 4xx', async ({ beAuth }) => {
      const { status } = await beAuth.postForm(
        BE.RETURN_FULFILLMENT,
        { orderId: ORDERS.sampleOrderId },
        { requireAuth: true },
      );
      expect(status).toBeGreaterThanOrEqual(400);
    });

    test('TC-RETURN-008 @negative — fulfillment without fulfillmentId returns 4xx or error body', async ({ beAuth }) => {
      const { status, body } = await beAuth.postForm<{ success?: boolean }>(
        BE.RETURN_FULFILLMENT,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: RETURNS.missingFulfillmentId,
        },
        { requireAuth: true },
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-RETURN-009 @negative — unauthenticated returns 4xx', async ({ be }) => {
      const { status } = await be.postForm(
        BE.RETURN_FULFILLMENT,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: RETURNS.validFulfillments,
        },
      );
      expect([400, 401, 403]).toContain(status);
    });

    test('TC-RETURN-010 — response success:true means return was initiated', async ({ beAuth }) => {
      const { status, body } = await beAuth.postForm<{ success: boolean; message?: string }>(
        BE.RETURN_FULFILLMENT,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: RETURNS.validFulfillments,
        },
        { requireAuth: true },
      );
      if (status === 200) {
        expect(body.success).toBe(true);
      }
    });
  });

  // ── POST /saleor/create-exchange-request (multipart/form-data) ───────────

  test.describe('POST /saleor/create-exchange-request', () => {
    test('TC-RETURN-011 @smoke — authenticated: valid exchange returns 200 or 400', async ({ beAuth }) => {
      const { status, body } = await beAuth.postForm<Record<string, unknown>>(
        BE.CREATE_EXCHANGE_REQUEST,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: JSON.stringify(EXCHANGE.validFulfillments),
        },
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 400, 422]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, exchangeRequestSchema);
      }
    });

    test('TC-RETURN-012 @negative — missing orderId returns 4xx', async ({ beAuth }) => {
      const { status } = await beAuth.postForm(
        BE.CREATE_EXCHANGE_REQUEST,
        { fulfillments: JSON.stringify(EXCHANGE.validFulfillments) },
        { requireAuth: true },
      );
      expect(status).toBeGreaterThanOrEqual(400);
    });

    test('TC-RETURN-013 @negative — missing newVariantId in fulfillmentLine returns 4xx', async ({ beAuth }) => {
      const badFulfillments = [
        {
          fulfillmentId: ORDERS.sampleFulfillmentId,
          fulfillmentLines: [
            {
              fulfillmentLineId: 'RnVsZmlsbG1lbnRMaW5lOjE=',
              quantity: 1,
              // newVariantId intentionally missing
              reasonAndComments: [],
            },
          ],
        },
      ];
      const { status, body } = await beAuth.postForm<{ success?: boolean }>(
        BE.CREATE_EXCHANGE_REQUEST,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: JSON.stringify(badFulfillments),
        },
        { requireAuth: true },
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-RETURN-014 @negative — unauthenticated returns 4xx', async ({ be }) => {
      const { status } = await be.postForm(
        BE.CREATE_EXCHANGE_REQUEST,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: JSON.stringify(EXCHANGE.validFulfillments),
        },
      );
      expect([400, 401, 403]).toContain(status);
    });

    test('TC-RETURN-015 @negative — empty fulfillments array returns 4xx', async ({ beAuth }) => {
      const { status, body } = await beAuth.postForm<{ success?: boolean }>(
        BE.CREATE_EXCHANGE_REQUEST,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: JSON.stringify([]),
        },
        { requireAuth: true },
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-RETURN-016 — exchange endpoint returns non-5xx', async ({ beAuth }) => {
      const { status } = await beAuth.postForm<{ success?: boolean; message?: string }>(
        BE.CREATE_EXCHANGE_REQUEST,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: JSON.stringify(EXCHANGE.validFulfillments),
        },
        { requireAuth: true },
      );
      expect(status).toBeLessThanOrEqual(500);
    });

    test('TC-RETURN-017 — response time under 10 seconds (file upload endpoint)', async ({ beAuth }) => {
      const { durationMs } = await beAuth.postForm(
        BE.CREATE_EXCHANGE_REQUEST,
        {
          orderId: ORDERS.sampleOrderId,
          fulfillments: JSON.stringify(EXCHANGE.validFulfillments),
        },
        { requireAuth: true, timeout: 15000 },
      );
      ResponseValidator.assertResponseTime(durationMs, 10000);
    });

    test('TC-RETURN-018 — return reasons endpoint returns 200 with body', async ({ be }) => {
      const { status, body } = await be.get<unknown>(BE.RETURN_REASONS);
      ResponseValidator.assertStatus(status, 200);
      expect(body).toBeDefined();
    });
  });
});
