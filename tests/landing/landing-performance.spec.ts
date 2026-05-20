import { test, expect } from '../../fixtures/base.fixture';
import {
  collectWebVitals,
  collectResourceSummary,
  throttleNetwork,
  formatVitalsReport,
  PERF_BUDGETS,
} from '../../utils/performance.util';

/**
 * TC-LP-021 → TC-LP-025
 * Page Performance Testing — Landing Page & PDP
 *
 * All vitals are collected via window.performance + PerformanceObserver (no external tools).
 * Network profiles: none (desktop), fast4g (desktop), slow3g (mobile).
 * Reports are attached as text artifacts to every test run.
 *
 * Run with ENVIRONMENT=production for the target URL: /native-bombay-blue
 */
test.describe('Landing Page — Performance Metrics', () => {

  // ── TC-LP-021 ──────────────────────────────────────────────────────────────
  test('TC-LP-021 @smoke — Landing Page FCP < 3000ms (desktop, no throttle)', async ({ landingPage, page }) => {
    await landingPage.goto();
    await page.waitForLoadState('networkidle');

    const vitals = await collectWebVitals(page);
    const resources = await collectResourceSummary(page);

    await test.info().attach('perf-landing-desktop.txt', {
      body: formatVitalsReport('Landing Page — Desktop (no throttle)', vitals, resources),
      contentType: 'text/plain',
    });

    console.log(`[PERF] Landing Desktop — FCP: ${vitals.fcp.toFixed(0)}ms | LCP: ${vitals.lcp.toFixed(0)}ms | CLS: ${vitals.cls.toFixed(4)}`);

    expect(
      vitals.fcp,
      `FCP ${vitals.fcp.toFixed(0)}ms exceeds desktop budget of ${PERF_BUDGETS.desktop.fcp}ms`,
    ).toBeLessThan(PERF_BUDGETS.desktop.fcp);
  });

  // ── TC-LP-022 ──────────────────────────────────────────────────────────────
  test('TC-LP-022 @regression — Landing Page LCP < 2500ms (desktop, no throttle)', async ({ landingPage, page }) => {
    await landingPage.goto();
    await page.waitForLoadState('networkidle');

    const vitals = await collectWebVitals(page);
    const resources = await collectResourceSummary(page);

    await test.info().attach('perf-landing-lcp-desktop.txt', {
      body: formatVitalsReport('Landing Page — LCP Desktop', vitals, resources),
      contentType: 'text/plain',
    });

    expect(
      vitals.lcp,
      `LCP ${vitals.lcp.toFixed(0)}ms exceeds desktop budget of ${PERF_BUDGETS.desktop.lcp}ms`,
    ).toBeLessThan(PERF_BUDGETS.desktop.lcp);
  });

  // ── TC-LP-023 ──────────────────────────────────────────────────────────────
  test('TC-LP-023 @regression — Landing Page CLS < 0.1 (desktop)', async ({ landingPage, page }) => {
    await landingPage.goto();
    await page.waitForLoadState('networkidle');
    // Extra wait to capture all layout shifts during full render
    await page.waitForTimeout(2000);

    const vitals = await collectWebVitals(page);

    console.log(`[PERF] Landing Page CLS: ${vitals.cls.toFixed(4)}`);

    expect(
      vitals.cls,
      `CLS ${vitals.cls.toFixed(4)} exceeds threshold ${PERF_BUDGETS.desktop.cls} — layout instability detected`,
    ).toBeLessThan(PERF_BUDGETS.desktop.cls);
  });

  // ── TC-LP-024 ──────────────────────────────────────────────────────────────
  test('TC-LP-024 @regression — Landing Page FCP < 5000ms (Slow 3G, mobile 390px)', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();

    try {
      // Apply throttling BEFORE navigation
      await throttleNetwork(page, 'slow3g');

      const { LandingPage } = await import('../../pages/landing.page');
      const landingPage = new LandingPage(page);

      await landingPage.goto();
      await page.waitForLoadState('domcontentloaded');
      // Don't wait for networkidle on slow3g — it may never settle
      await page.waitForTimeout(3000);

      const vitals = await collectWebVitals(page);
      const resources = await collectResourceSummary(page);

      await test.info().attach('perf-landing-slow3g-mobile.txt', {
        body: formatVitalsReport('Landing Page — Slow 3G Mobile', vitals, resources),
        contentType: 'text/plain',
      });

      console.log(`[PERF] Landing Slow3G — FCP: ${vitals.fcp.toFixed(0)}ms | LCP: ${vitals.lcp.toFixed(0)}ms | CLS: ${vitals.cls.toFixed(4)}`);

      expect(
        vitals.fcp,
        `FCP ${vitals.fcp.toFixed(0)}ms exceeds Slow 3G budget of ${PERF_BUDGETS.slow3g.fcp}ms`,
      ).toBeLessThan(PERF_BUDGETS.slow3g.fcp);
    } finally {
      await ctx.close();
    }
  });

  // ── TC-LP-025 ──────────────────────────────────────────────────────────────
  test('TC-LP-025 @regression — PDP Web Vitals collected after Know More navigation', async ({ landingPage, page }) => {
    const failedRequests: Array<{ url: string; status: number }> = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({ url: response.url(), status: response.status() });
      }
    });

    await landingPage.goto();
    await landingPage.clickKnowMore();
    await page.waitForLoadState('networkidle');

    const vitals = await collectWebVitals(page);
    const resources = await collectResourceSummary(page);
    resources.failedRequests = failedRequests;

    const report = [
      formatVitalsReport('PDP — after Know More (desktop)', vitals, resources),
      '',
      `Failed Requests (${failedRequests.length}):`,
      ...failedRequests.map((r) => `  [${r.status}] ${r.url}`),
    ].join('\n');

    await test.info().attach('perf-pdp-know-more.txt', {
      body: report,
      contentType: 'text/plain',
    });

    console.log(`[PERF] PDP (Know More) — FCP: ${vitals.fcp.toFixed(0)}ms | LCP: ${vitals.lcp.toFixed(0)}ms | CLS: ${vitals.cls.toFixed(4)} | Requests: ${resources.totalRequests}`);

    // Soft budget checks — PDP is allowed slightly higher than landing page
    expect(
      vitals.fcp,
      `PDP FCP ${vitals.fcp.toFixed(0)}ms exceeds mobile budget ${PERF_BUDGETS.mobile.fcp}ms`,
    ).toBeLessThan(PERF_BUDGETS.mobile.fcp);

    expect(
      vitals.cls,
      `PDP CLS ${vitals.cls.toFixed(4)} exceeds threshold ${PERF_BUDGETS.mobile.cls}`,
    ).toBeLessThan(PERF_BUDGETS.mobile.cls);

    // Resource weight guard — flag if image payload > 3 MB
    const imageMB = resources.totalImageBytes / (1024 * 1024);
    if (imageMB > 3) {
      console.warn(`[PERF] PDP image payload is ${imageMB.toFixed(2)} MB — consider optimising large images`);
    }

    // No 5xx errors should occur
    const serverErrors = failedRequests.filter((r) => r.status >= 500);
    expect(
      serverErrors.length,
      `${serverErrors.length} server error(s) during PDP load:\n${serverErrors.map((r) => `[${r.status}] ${r.url}`).join('\n')}`,
    ).toBe(0);
  });

  // ── TC-LP-025b — Order Now PDP performance (bonus) ─────────────────────────
  test('TC-LP-025b @regression — PDP Web Vitals collected after Order Now navigation', async ({ landingPage, page }) => {
    const failedRequests: Array<{ url: string; status: number }> = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({ url: response.url(), status: response.status() });
      }
    });

    await landingPage.goto();
    await landingPage.clickOrderNow();
    await page.waitForLoadState('networkidle');

    const vitals = await collectWebVitals(page);
    const resources = await collectResourceSummary(page);
    resources.failedRequests = failedRequests;

    const report = [
      formatVitalsReport('PDP — after Order Now (desktop)', vitals, resources),
      '',
      `Failed Requests (${failedRequests.length}):`,
      ...failedRequests.map((r) => `  [${r.status}] ${r.url}`),
    ].join('\n');

    await test.info().attach('perf-pdp-order-now.txt', {
      body: report,
      contentType: 'text/plain',
    });

    console.log(`[PERF] PDP (Order Now) — FCP: ${vitals.fcp.toFixed(0)}ms | LCP: ${vitals.lcp.toFixed(0)}ms | CLS: ${vitals.cls.toFixed(4)} | TBT: ${vitals.tbt.toFixed(0)}ms`);

    expect(vitals.fcp, `PDP FCP ${vitals.fcp.toFixed(0)}ms exceeds budget ${PERF_BUDGETS.mobile.fcp}ms`).toBeLessThan(PERF_BUDGETS.mobile.fcp);
    expect(vitals.cls, `PDP CLS ${vitals.cls.toFixed(4)} exceeds threshold 0.1`).toBeLessThan(0.1);

    const serverErrors = failedRequests.filter((r) => r.status >= 500);
    expect(serverErrors.length, `${serverErrors.length} server error(s) during PDP load`).toBe(0);
  });
});
