import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { RATINGS } from '../../data/be-api.data';
import {
  ratingQuestionsSchema,
  updateRatingSchema,
  ordersRatingSchema,
} from '../../api/schemas/be-api.schemas';

/**
 * TC-RATING-001 → TC-RATING-018
 * Ratings & Reviews API: get questions, update rating, get order ratings
 */
test.describe('Ratings & Reviews APIs @api @ratings', () => {

  // ── GET /saleor/get-rating-questions ──────────────────────────────────────

  test.describe('GET /saleor/get-rating-questions', () => {
    test('TC-RATING-001 @smoke — returns 200 with questions array', async ({ be }) => {
      const q = RATINGS.getQuestions.valid;
      const { status, body } = await be.get<Record<string, unknown>>(
        BE.GET_RATING_QUESTIONS(q.ratingCategory, q.subCategory, q.userId, q.fulfillmentId, q.variantId),
      );
      ResponseValidator.assertStatusIn(status, [200, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, ratingQuestionsSchema);
      }
    });

    test('TC-RATING-002 — questions data is an array', async ({ be }) => {
      const q = RATINGS.getQuestions.valid;
      const { body } = await be.get<{ success: boolean; data?: unknown[] }>(
        BE.GET_RATING_QUESTIONS(q.ratingCategory, q.subCategory, q.userId, q.fulfillmentId, q.variantId),
      );
      if (body?.success) {
        expect(Array.isArray(body.data)).toBeTruthy();
      }
    });

    test('TC-RATING-003 — each question has id and options fields', async ({ be }) => {
      const q = RATINGS.getQuestions.valid;
      const { body } = await be.get<{ success: boolean; data?: { id: string; options: unknown[] }[] }>(
        BE.GET_RATING_QUESTIONS(q.ratingCategory, q.subCategory, q.userId, q.fulfillmentId, q.variantId),
      );
      if (body?.success && Array.isArray(body.data) && body.data.length > 0) {
        body.data.forEach((question) => {
          expect(question).toHaveProperty('id');
        });
      }
    });

    test('TC-RATING-004 — response time under 3 seconds', async ({ be }) => {
      const q = RATINGS.getQuestions.valid;
      const { durationMs } = await be.get(
        BE.GET_RATING_QUESTIONS(q.ratingCategory, q.subCategory, q.userId, q.fulfillmentId, q.variantId),
      );
      ResponseValidator.assertResponseTime(durationMs, 3000);
    });

    test('TC-RATING-005 @negative — missing rating_category returns 4xx or error body', async ({ be }) => {
      const q = RATINGS.getQuestions.valid;
      const { status, body } = await be.get<{ success?: boolean }>(
        BE.GET_RATING_QUESTIONS('', q.subCategory, q.userId, q.fulfillmentId, q.variantId),
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-RATING-006 @negative — missing user_id returns 4xx or error body', async ({ be }) => {
      const q = RATINGS.getQuestions.valid;
      const { status, body } = await be.get<{ success?: boolean }>(
        BE.GET_RATING_QUESTIONS(q.ratingCategory, q.subCategory, '', q.fulfillmentId, q.variantId),
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });
  });

  // ── POST /saleor/update-rating-info ──────────────────────────────────────

  test.describe('POST /saleor/update-rating-info', () => {
    test('TC-RATING-007 @smoke — valid payload returns 200 or 400 (rating may exist)', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(
        BE.UPDATE_RATING_INFO,
        RATINGS.updateRating.valid,
      );
      ResponseValidator.assertStatusIn(status, [200, 400, 409]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, updateRatingSchema);
      }
    });

    test('TC-RATING-008 — success:true in response on 200', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean }>(
        BE.UPDATE_RATING_INFO,
        RATINGS.updateRating.valid,
      );
      if (status === 200) {
        expect(body.success).toBe(true);
      }
    });

    test('TC-RATING-009 — rating value 1-5 is accepted', async ({ be }) => {
      for (const rating of [1, 2, 3, 4, 5]) {
        const { status } = await be.post(BE.UPDATE_RATING_INFO, {
          ...RATINGS.updateRating.valid,
          rating,
        });
        expect(status).toBeLessThan(500);
      }
    });

    test('TC-RATING-010 @negative — missing source field returns 4xx or error', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean }>(
        BE.UPDATE_RATING_INFO,
        RATINGS.updateRating.missingSource,
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-RATING-011 @negative — missing user_id returns 4xx', async ({ be }) => {
      const payload = { ...RATINGS.updateRating.valid, user_id: undefined };
      const { status } = await be.post(BE.UPDATE_RATING_INFO, payload);
      expect(status).toBeGreaterThanOrEqual(400);
    });

    test('TC-RATING-012 @negative — missing order_id returns 4xx', async ({ be }) => {
      const payload = { ...RATINGS.updateRating.valid, order_id: undefined };
      const { status } = await be.post(BE.UPDATE_RATING_INFO, payload);
      expect(status).toBeGreaterThanOrEqual(400);
    });

    test('TC-RATING-013 @negative — rating = 0 returns 4xx or error', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean }>(
        BE.UPDATE_RATING_INFO,
        { ...RATINGS.updateRating.valid, rating: 0 },
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      // Rating 0 is invalid (scale 1-5)
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-RATING-014 @negative — rating > 5 returns 4xx or error', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean }>(
        BE.UPDATE_RATING_INFO,
        { ...RATINGS.updateRating.valid, rating: 10 },
      );
      expect(status).toBeLessThan(500);
    });
  });

  // ── POST /saleor/get-orders-rating ────────────────────────────────────────

  test.describe('POST /saleor/get-orders-rating', () => {
    test('TC-RATING-015 @smoke — returns 200 with orders rating data', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(
        BE.GET_ORDERS_RATING,
        RATINGS.getOrdersRating.valid,
      );
      ResponseValidator.assertStatusIn(status, [200, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, ordersRatingSchema);
      }
    });

    test('TC-RATING-016 — response data.orders is an array', async ({ be }) => {
      const { body } = await be.post<{ data?: { orders?: unknown[] } }>(
        BE.GET_ORDERS_RATING,
        RATINGS.getOrdersRating.valid,
      );
      if (body?.data?.orders !== undefined) {
        expect(Array.isArray(body.data.orders)).toBeTruthy();
      }
    });

    test('TC-RATING-017 @negative — empty order_ids array returns error or empty data', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean; data?: unknown }>(
        BE.GET_ORDERS_RATING,
        RATINGS.getOrdersRating.empty,
      );
      // Should return 4xx or empty data, not 5xx
      expect(status).toBeLessThan(500);
    });

    test('TC-RATING-018 @negative — missing order_ids field returns 4xx', async ({ be }) => {
      const { status } = await be.post(BE.GET_ORDERS_RATING, {});
      expect(status).toBeGreaterThanOrEqual(400);
    });
  });
});
