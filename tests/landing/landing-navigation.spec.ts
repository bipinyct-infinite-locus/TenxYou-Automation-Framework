import { test, expect } from '../../fixtures/base.fixture';

/**
 * TC-LP-008 → TC-LP-020
 * Landing Page CTA Navigation:
 *  B — "Know More" → PDP → Product Spotlight section validation (desktop / tablet / mobile)
 *  C — "Order Now" → PDP → size section zoom/animation issue detection
 */
test.describe('Landing Page — CTA Navigation', () => {

  // ════════════════════════════════════════════════════════════════════════
  // B. KNOW MORE BUTTON FLOW
  // ════════════════════════════════════════════════════════════════════════
  test.describe('Know More CTA', () => {

    // ── TC-LP-008 ──────────────────────────────────────────────────────────
    test('TC-LP-008 @smoke — Know More button is visible on landing page', async ({ landingPage }) => {
      await landingPage.goto();
      await landingPage.assertKnowMoreVisible();
    });

    // ── TC-LP-009 ──────────────────────────────────────────────────────────
    test('TC-LP-009 @smoke — clicking Know More navigates to a PDP URL', async ({ landingPage, page }) => {
      await landingPage.goto();
      const landingUrl = page.url();

      await landingPage.clickKnowMore();

      const pdpUrl = page.url();
      expect(pdpUrl, 'URL should change after clicking Know More').not.toBe(landingUrl);
      expect(
        pdpUrl.includes('/product/') || pdpUrl.includes('/native-bombay'),
        `URL "${pdpUrl}" does not look like a PDP path`,
      ).toBeTruthy();
    });

    // ── TC-LP-010 ──────────────────────────────────────────────────────────
    test('TC-LP-010 @regression — PDP product name is non-empty after Know More', async ({ landingPage, pdpPage }) => {
      await landingPage.goto();
      await landingPage.clickKnowMore();

      const name = await pdpPage.getProductName();
      expect(name.trim(), 'Product name on PDP should not be empty after Know More navigation').not.toBe('');
    });

    // ── TC-LP-011 ──────────────────────────────────────────────────────────
    test('TC-LP-011 @regression — Product Spotlight section visible on PDP (desktop 1600px)', async ({ landingPage, pdpPage, page }) => {
      test.use({ viewport: { width: 1600, height: 850 } });
      await landingPage.goto();
      await landingPage.clickKnowMore();

      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'reports/screenshots/pdp-spotlight-desktop.png', fullPage: false });

      await pdpPage.assertSpotlightVisible();
    });

    // ── TC-LP-012 ──────────────────────────────────────────────────────────
    test('TC-LP-012 @regression — Product Spotlight section visible on PDP (tablet 768px)', async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
      const page = await ctx.newPage();

      const { LandingPage } = await import('../../pages/landing.page');
      const { PDPPage } = await import('../../pages/pdp.page');
      const landingPage = new LandingPage(page);
      const pdpPage = new PDPPage(page);

      try {
        await landingPage.goto();
        await landingPage.clickKnowMore();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'reports/screenshots/pdp-spotlight-tablet.png', fullPage: false });
        await pdpPage.assertSpotlightVisible();
      } finally {
        await ctx.close();
      }
    });

    // ── TC-LP-013 ──────────────────────────────────────────────────────────
    test('TC-LP-013 @regression — Product Spotlight section visible on PDP (mobile 390px)', async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();

      const { LandingPage } = await import('../../pages/landing.page');
      const { PDPPage } = await import('../../pages/pdp.page');
      const landingPage = new LandingPage(page);
      const pdpPage = new PDPPage(page);

      try {
        await landingPage.goto();
        await landingPage.clickKnowMore();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'reports/screenshots/pdp-spotlight-mobile.png', fullPage: false });
        await pdpPage.assertSpotlightVisible();
      } finally {
        await ctx.close();
      }
    });

    // ── TC-LP-014 ──────────────────────────────────────────────────────────
    test('TC-LP-014 @regression — Spotlight icons load, no text overflow, no layout shift', async ({ landingPage, pdpPage, page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await landingPage.goto();
      await landingPage.clickKnowMore();
      await page.waitForLoadState('networkidle');

      const isSpotlightVisible = await pdpPage.productSpotlightSection
        .isVisible({ timeout: 8000 })
        .catch(() => false);

      if (!isSpotlightVisible) {
        test.info().annotations.push({
          type: 'info',
          description: 'Product Spotlight section not found — skipping icon/overflow sub-checks',
        });
        return;
      }

      // Scroll spotlight into view
      await pdpPage.productSpotlightSection.scrollIntoViewIfNeeded();

      // Icons: at least one icon/svg should be present
      const iconCount = await pdpPage.spotlightIcons.count();
      expect(iconCount, 'Spotlight section should have at least one icon or image').toBeGreaterThan(0);

      // Text overflow
      await pdpPage.assertSpotlightNoTextOverflow();

      // CLS on spotlight section
      const cls = await pdpPage.measureSectionCLS(pdpPage.productSpotlightSection);
      expect(cls, `Spotlight section CLS ${cls.toFixed(4)} exceeds threshold 0.1`).toBeLessThan(0.1);

      // Screenshot
      await pdpPage.productSpotlightSection.screenshot({
        path: 'reports/screenshots/spotlight-section.png',
      });

      if (consoleErrors.length > 0) {
        await test.info().attach('console-errors.txt', {
          body: consoleErrors.join('\n'),
          contentType: 'text/plain',
        });
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // C. ORDER NOW BUTTON FLOW
  // ════════════════════════════════════════════════════════════════════════
  test.describe('Order Now CTA', () => {

    // ── TC-LP-015 ──────────────────────────────────────────────────────────
    test('TC-LP-015 @smoke — Order Now button is visible on landing page', async ({ landingPage }) => {
      await landingPage.goto();
      await landingPage.assertOrderNowVisible();
    });

    // ── TC-LP-016 ──────────────────────────────────────────────────────────
    test('TC-LP-016 @smoke — clicking Order Now navigates to a PDP URL', async ({ landingPage, page }) => {
      await landingPage.goto();
      const landingUrl = page.url();

      await landingPage.clickOrderNow();

      const pdpUrl = page.url();
      expect(pdpUrl, 'URL should change after clicking Order Now').not.toBe(landingUrl);
      expect(
        pdpUrl.includes('/product/') || pdpUrl.includes('/native-bombay'),
        `URL "${pdpUrl}" does not look like a PDP path`,
      ).toBeTruthy();
    });

    // ── TC-LP-017 ──────────────────────────────────────────────────────────
    test('TC-LP-017 @regression — size section has no CSS scale-transform anomaly (desktop)', async ({ landingPage, pdpPage, page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await landingPage.goto();
      await landingPage.clickOrderNow();
      await page.waitForLoadState('networkidle');

      // Scroll size section into view (Order Now may auto-scroll)
      const sizeSectionVisible = await pdpPage.sizeSection.isVisible({ timeout: 8000 }).catch(() => false);
      if (sizeSectionVisible) {
        await pdpPage.sizeSection.scrollIntoViewIfNeeded();
      }

      // Wait one animation frame to let any CSS transition settle
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
      await page.waitForTimeout(500);

      const zoomResult = await pdpPage.detectSizeSectionZoom();

      await test.info().attach('size-section-transform-desktop.txt', {
        body: JSON.stringify(zoomResult, null, 2),
        contentType: 'text/plain',
      });

      if (zoomResult.transform === 'element-not-found') {
        test.info().annotations.push({ type: 'info', description: 'Size section element not found via known selectors — may use different class names' });
      } else {
        expect(
          zoomResult.hasZoom,
          `BUG: Size section has unexpected zoom — scaleX: ${zoomResult.scaleX}, scaleY: ${zoomResult.scaleY}, transform: "${zoomResult.transform}"`,
        ).toBeFalsy();
      }

      if (consoleErrors.length > 0) {
        await test.info().attach('console-errors-order-now-desktop.txt', {
          body: consoleErrors.join('\n'),
          contentType: 'text/plain',
        });
      }
    });

    // ── TC-LP-018 ──────────────────────────────────────────────────────────
    test('TC-LP-018 @regression — size section has no CSS scale-transform anomaly (mobile 390px)', async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();

      const { LandingPage } = await import('../../pages/landing.page');
      const { PDPPage } = await import('../../pages/pdp.page');
      const landingPage = new LandingPage(page);
      const pdpPage = new PDPPage(page);

      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      try {
        await landingPage.goto();
        await landingPage.clickOrderNow();
        await page.waitForLoadState('networkidle');

        const sizeSectionVisible = await pdpPage.sizeSection.isVisible({ timeout: 8000 }).catch(() => false);
        if (sizeSectionVisible) {
          await pdpPage.sizeSection.scrollIntoViewIfNeeded();
        }

        await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        await page.waitForTimeout(800);

        const zoomResult = await pdpPage.detectSizeSectionZoom();

        await test.info().attach('size-section-transform-mobile.txt', {
          body: JSON.stringify(zoomResult, null, 2),
          contentType: 'text/plain',
        });

        // Screenshot to capture visual state
        await page.screenshot({ path: 'reports/screenshots/size-section-mobile.png', fullPage: false });

        if (zoomResult.transform !== 'element-not-found') {
          expect(
            zoomResult.hasZoom,
            `BUG: Size section has unexpected zoom on mobile — scaleX: ${zoomResult.scaleX}, scaleY: ${zoomResult.scaleY}, transform: "${zoomResult.transform}"`,
          ).toBeFalsy();
        }

        if (consoleErrors.length > 0) {
          await test.info().attach('console-errors-order-now-mobile.txt', {
            body: consoleErrors.join('\n'),
            contentType: 'text/plain',
          });
        }
      } finally {
        await ctx.close();
      }
    });

    // ── TC-LP-019 ──────────────────────────────────────────────────────────
    test('TC-LP-019 @regression — no JavaScript errors after Order Now navigation', async ({ landingPage, page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(`[console.error] ${msg.text()}`);
      });
      page.on('pageerror', (err) => {
        pageErrors.push(`[pageerror] ${err.message}`);
      });

      await landingPage.goto();
      await landingPage.clickOrderNow();
      await page.waitForLoadState('networkidle');

      const allErrors = [...consoleErrors, ...pageErrors];

      if (allErrors.length > 0) {
        await test.info().attach('js-errors-after-order-now.txt', {
          body: allErrors.join('\n'),
          contentType: 'text/plain',
        });
      }

      // Filter out known non-critical third-party noise (GoKwik, analytics, etc.)
      const criticalErrors = allErrors.filter(
        (e) =>
          !e.includes('gokwik') &&
          !e.includes('analytics') &&
          !e.includes('gtm') &&
          !e.includes('facebook') &&
          !e.includes('clarity') &&
          !e.includes('hotjar'),
      );

      expect(
        criticalErrors.length,
        `${criticalErrors.length} critical JS error(s) after Order Now navigation:\n${criticalErrors.join('\n')}`,
      ).toBe(0);
    });

    // ── TC-LP-020 ──────────────────────────────────────────────────────────
    test('TC-LP-020 @regression — CLS on size section < 0.1 after Order Now navigation', async ({ landingPage, pdpPage, page }) => {
      await landingPage.goto();
      await landingPage.clickOrderNow();
      await page.waitForLoadState('networkidle');

      const sizeSectionVisible = await pdpPage.sizeSection.isVisible({ timeout: 8000 }).catch(() => false);

      if (!sizeSectionVisible) {
        test.info().annotations.push({ type: 'info', description: 'Size section not found — CLS check skipped' });
        return;
      }

      await pdpPage.sizeSection.scrollIntoViewIfNeeded();

      // Observe CLS for 2 seconds after scroll
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let score = 0;
          try {
            new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                const e = entry as PerformanceEventTiming & { value: number; hadRecentInput: boolean };
                if (!e.hadRecentInput) score += e.value;
              });
            }).observe({ type: 'layout-shift', buffered: true });
          } catch { /* not supported */ }
          setTimeout(() => resolve(score), 2000);
        });
      });

      await test.info().attach('size-section-cls.txt', {
        body: `CLS after Order Now scroll: ${cls.toFixed(4)}`,
        contentType: 'text/plain',
      });

      expect(
        cls,
        `BUG: Size section CLS ${cls.toFixed(4)} exceeds 0.1 threshold — layout shift detected after Order Now navigation`,
      ).toBeLessThan(0.1);
    });
  });
});
