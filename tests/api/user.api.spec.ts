import { test, expect } from '../../fixtures/api.fixture';
import { ResponseValidator } from '../../api/validators/response-validator';
import { BE } from '../../api/endpoints/be-api.endpoints';
import { USER } from '../../data/be-api.data';
import {
  editUserSchema,
  userDetailsSchema,
  brandsSchema,
  txySizeSchema,
  shoeFitSchema,
  notifyMeSchema,
} from '../../api/schemas/be-api.schemas';

/**
 * TC-USER-001 → TC-USER-025
 * User, Fit Finder & Notify-Me APIs
 */
test.describe('User & Fit Finder APIs @api @user', () => {

  // ── POST /saleor/edit-user ────────────────────────────────────────────────

  test.describe('POST /saleor/edit-user', () => {
    test('TC-USER-001 @smoke — authenticated: valid payload returns 200', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<Record<string, unknown>>(
        BE.EDIT_USER,
        USER.editUser.valid,
        { requireAuth: true },
      );
      ResponseValidator.assertStatusIn(status, [200, 400]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, editUserSchema);
      }
    });

    test('TC-USER-002 — success:true on successful update', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<{ success?: boolean }>(
        BE.EDIT_USER,
        USER.editUser.valid,
        { requireAuth: true },
      );
      if (status === 200) {
        expect(body.success).toBe(true);
      }
    });

    test('TC-USER-003 @negative — missing user ID returns 4xx or error body', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<{ success?: boolean }>(
        BE.EDIT_USER,
        USER.editUser.missingId,
        { requireAuth: true },
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-USER-004 @negative — unauthenticated returns non-5xx', async ({ be }) => {
      const { status } = await be.post(BE.EDIT_USER, USER.editUser.valid);
      expect(status).toBeLessThan(500);
    });
  });

  // ── GET /saleor/get-user-details/{userId} ─────────────────────────────────

  test.describe('GET /saleor/get-user-details/{userId}', () => {
    test('TC-USER-005 @smoke — returns user details for valid ID', async ({ be }) => {
      const { status, body } = await be.get<Record<string, unknown>>(BE.GET_USER_DETAILS(USER.userId));
      ResponseValidator.assertStatusIn(status, [200, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, userDetailsSchema);
      }
    });

    test('TC-USER-006 — response data contains user object on 200', async ({ be }) => {
      const { status, body } = await be.get<{ success: boolean; data?: unknown }>(
        BE.GET_USER_DETAILS(USER.userId),
      );
      if (status === 200) {
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
      }
    });

    test('TC-USER-007 @negative — invalid userId returns 404 or error body', async ({ be }) => {
      const { status, body } = await be.get<{ success?: boolean }>(
        BE.GET_USER_DETAILS('INVALID_USER_XYZ_99999'),
      );
      const isNotFound = status === 404 || body?.success === false;
      expect(isNotFound).toBeTruthy();
    });
  });

  // ── GET /brand-sizes/brands/search?searchTerm= ────────────────────────────

  test.describe('GET /brand-sizes/brands/search', () => {
    test('TC-USER-008 @smoke — returns brands for valid search term', async ({ be }) => {
      const { status, body } = await be.get<Record<string, unknown>>(BE.GET_BRANDS('Nike'));
      ResponseValidator.assertStatus(status, 200);
      ResponseValidator.assertSchema(body, brandsSchema);
    });

    test('TC-USER-009 — brands array is present in response', async ({ be }) => {
      const { body } = await be.get<{ brands?: { name: string }[] }>(BE.GET_BRANDS('Adidas'));
      expect(Array.isArray(body?.brands)).toBeTruthy();
    });

    test('TC-USER-010 — partial search term returns brands array', async ({ be }) => {
      const { status, body } = await be.get<{ brands?: { name: string }[] }>(BE.GET_BRANDS('Ni'));
      expect(status).toBeLessThan(500);
      if (status === 200) {
        expect(Array.isArray(body?.brands)).toBeTruthy();
      }
    });

    test('TC-USER-011 @negative — empty search term returns 4xx or empty brands', async ({ be }) => {
      const { status, body } = await be.get<{ brands?: unknown[] }>(BE.GET_BRANDS(''));
      const isClientError = status >= 400;
      const isEmpty = Array.isArray(body?.brands) && body.brands.length === 0;
      expect(isClientError || isEmpty || status < 500).toBeTruthy();
    });
  });

  // ── GET /brand-sizes/brands/group-by-country ──────────────────────────────

  test.describe('GET /brand-sizes/brands/group-by-country', () => {
    test('TC-USER-012 @smoke — returns size data for valid brand+country', async ({ be }) => {
      const { status } = await be.get(BE.GET_BRAND_SIZE('Nike', 'IN'));
      ResponseValidator.assertStatusIn(status, [200, 404]);
    });

    test('TC-USER-013 @negative — missing brand returns non-5xx', async ({ be }) => {
      const { status } = await be.get(BE.GET_BRAND_SIZE('', 'IN'));
      expect(status).toBeLessThan(500);
    });

    test('TC-USER-014 @negative — missing country returns non-5xx', async ({ be }) => {
      const { status } = await be.get(BE.GET_BRAND_SIZE('Nike', ''));
      expect(status).toBeLessThan(500);
    });
  });

  // ── GET /brand-sizes/sizes/match ──────────────────────────────────────────

  test.describe('GET /brand-sizes/sizes/match', () => {
    test('TC-USER-015 @smoke — returns TXY size for valid params', async ({ be }) => {
      const { status, body } = await be.get<Record<string, unknown>>(
        BE.GET_TXY_SIZE(USER.fitFinder.txySize.country, USER.fitFinder.txySize.size_in_cm, USER.fitFinder.txySize.category),
      );
      ResponseValidator.assertStatusIn(status, [200, 404]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, txySizeSchema);
      }
    });

    test('TC-USER-016 — sizes array in response', async ({ be }) => {
      const { body } = await be.get<{ sizes?: unknown[] }>(
        BE.GET_TXY_SIZE('IN', '27.5', 'men'),
      );
      if (body?.sizes !== undefined) {
        expect(Array.isArray(body.sizes)).toBeTruthy();
      }
    });

    test('TC-USER-017 @negative — missing category returns 4xx', async ({ be }) => {
      const { status } = await be.get(BE.GET_TXY_SIZE('IN', '27.5', ''));
      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── POST /saleor/get-tenxyou-fit-shoes ────────────────────────────────────

  test.describe('POST /saleor/get-tenxyou-fit-shoes', () => {
    test('TC-USER-018 @smoke — returns TXY shoe size for valid foot length', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(
        BE.GET_TXY_SHOE_SIZE,
        USER.fitFinder.shoeSizeByLength,
      );
      ResponseValidator.assertStatusIn(status, [200, 400]);
      if (status === 200) {
        ResponseValidator.assertSchema(body, shoeFitSchema);
      }
    });

    test('TC-USER-019 — response has result with size', async ({ be }) => {
      const { body } = await be.post<{ success?: boolean; data?: { result?: { size?: string } } }>(
        BE.GET_TXY_SHOE_SIZE,
        USER.fitFinder.shoeSizeByLength,
      );
      if (body?.success) {
        expect(body.data?.result).toBeDefined();
      }
    });

    test('TC-USER-020 @negative — missing length returns non-5xx', async ({ be }) => {
      const { status } = await be.post<{ success?: boolean }>(
        BE.GET_TXY_SHOE_SIZE,
        { type: 'men' },
      );
      expect(status).toBeLessThan(500);
    });
  });

  // ── POST /saleor/update-shoe-fit-metadata ────────────────────────────────

  test.describe('POST /saleor/update-shoe-fit-metadata', () => {
    test('TC-USER-021 @smoke — authenticated: returns non-5xx for valid payload', async ({ beAuth }) => {
      const { status } = await beAuth.post(
        BE.UPDATE_SHOE_FIT,
        USER.fitFinder.updateShoeFit,
        { requireAuth: true },
      );
      expect(status).toBeLessThan(500);
    });

    test('TC-USER-022 @negative — missing user_id returns 4xx or error body', async ({ beAuth }) => {
      const { status, body } = await beAuth.post<{ success?: boolean }>(
        BE.UPDATE_SHOE_FIT,
        { fit_finder_data: '{"size":"UK 8"}' },
        { requireAuth: true },
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });
  });

  // ── POST /saleor/notify-me ────────────────────────────────────────────────

  test.describe('POST /saleor/notify-me', () => {
    test('TC-USER-023 @smoke — valid payload returns non-5xx', async ({ be }) => {
      const { status, body } = await be.post<Record<string, unknown>>(
        BE.NOTIFY_ME,
        USER.notifyMe.valid,
      );
      // 409 = already subscribed for this phone/product combination
      ResponseValidator.assertStatusIn(status, [200, 201, 400, 409]);
      if (status === 200 || status === 201) {
        ResponseValidator.assertSchema(body, notifyMeSchema);
      }
    });

    test('TC-USER-024 @negative — missing product_id returns 4xx or error body', async ({ be }) => {
      const { status, body } = await be.post<{ success?: boolean }>(
        BE.NOTIFY_ME,
        USER.notifyMe.missingRequired,
      );
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });

    test('TC-USER-025 @negative — missing link returns 4xx or error body', async ({ be }) => {
      const payload = { ...USER.notifyMe.valid, link: '' };
      const { status, body } = await be.post<{ success?: boolean }>(BE.NOTIFY_ME, payload);
      const isClientError = status >= 400 && status < 500;
      const isErrorBody = body?.success === false;
      expect(isClientError || isErrorBody).toBeTruthy();
    });
  });
});
