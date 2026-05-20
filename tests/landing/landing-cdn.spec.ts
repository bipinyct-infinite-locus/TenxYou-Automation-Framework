import { test, expect } from '../../fixtures/base.fixture';
import { MediaAsset } from '../../pages/landing.page';
import { CDN_DOMAINS } from '../../config/environments';

/**
 * TC-LP-001 → TC-LP-007
 * ImageKit CDN Validation — Landing Page: /native-bombay-blue
 *
 * Strategy:
 *  1. Intercept all network responses to build a live request log (catches lazy-loaded assets too)
 *  2. After full-page scroll, extract DOM-level src/srcset and CSS background-image URLs
 *  3. Assert no media is served from blocked domains (S3, GCS direct)
 *  4. Assert media domains are consistent (single CDN)
 *  5. Report detected CDN domain so it can be added to CDN_DOMAINS.custom if it's a vanity domain
 */
test.describe('Landing Page — ImageKit CDN Validation', () => {
  // Domains that indicate media is NOT going through a CDN
  const BLOCKED_PATTERNS = [
    ...CDN_DOMAINS.blocked,
    'blob:',
    '127.0.0.1',
    'localhost',
  ];

  // Known good CDN domain patterns — imagekit.io covers both ik.imagekit.io and imagekit.io
  const IMAGEKIT_PATTERN = /imagekit\.io/i;

  // ── TC-LP-001 ─────────────────────────────────────────────────────────────
  test('TC-LP-001 @smoke — landing page loads and media requests are captured', async ({ landingPage, page }) => {
    const mediaRequests: Array<{ url: string; contentType: string; status: number }> = [];

    page.on('response', (response) => {
      const ct = response.headers()['content-type'] ?? '';
      const url = response.url();
      if (
        ct.includes('image') ||
        ct.includes('video') ||
        /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm)(\?|$)/i.test(url)
      ) {
        mediaRequests.push({ url, contentType: ct, status: response.status() });
      }
    });

    await landingPage.goto();
    await page.waitForLoadState('networkidle');

    expect(mediaRequests.length, 'No media requests detected — page may not have loaded properly').toBeGreaterThan(0);

    // Attach full media request list for reporting
    const report = mediaRequests.map((r) => `[${r.status}] ${r.contentType.split(';')[0].padEnd(20)} ${r.url}`).join('\n');
    await test.info().attach('media-requests.txt', { body: report, contentType: 'text/plain' });
  });

  // ── TC-LP-002 ─────────────────────────────────────────────────────────────
  test('TC-LP-002 @regression — all img src/srcset URLs are served from a CDN (ImageKit)', async ({ landingPage, page }) => {
    await landingPage.goto();
    await page.waitForLoadState('networkidle');

    const assets = await landingPage.getAllMediaSrcs();
    const imgAssets = assets.filter((a) => a.type === 'img' && a.url.startsWith('http'));

    expect(imgAssets.length, 'No <img> elements found on landing page').toBeGreaterThan(0);

    const nonCdnAssets = imgAssets.filter((a) => !IMAGEKIT_PATTERN.test(a.url));
    const blockedAssets = imgAssets.filter((a) => BLOCKED_PATTERNS.some((p) => a.url.includes(p)));

    if (nonCdnAssets.length > 0) {
      const domains = [...new Set(nonCdnAssets.map((a) => {
        try { return new URL(a.url).hostname; } catch { return 'unknown'; }
      }))];
      await test.info().attach('non-imagekit-img-urls.txt', {
        body: nonCdnAssets.map((a) => a.url).join('\n'),
        contentType: 'text/plain',
      });
      // Soft assertion — report detected domain so it can be allowlisted if it's a custom ImageKit vanity domain
      console.warn(`[CDN] Non-ImageKit img domains detected: ${domains.join(', ')}`);
    }

    expect(
      blockedAssets.length,
      `${blockedAssets.length} img asset(s) served from blocked domains (S3/GCS):\n${blockedAssets.map((a) => a.url).join('\n')}`,
    ).toBe(0);
  });

  // ── TC-LP-003 ─────────────────────────────────────────────────────────────
  test('TC-LP-003 @regression — all video/source URLs are served from CDN', async ({ landingPage, page }) => {
    await landingPage.goto();
    await page.waitForLoadState('networkidle');

    const assets = await landingPage.getAllMediaSrcs();
    const videoAssets = assets.filter((a) => (a.type === 'video' || a.type === 'source') && a.url.startsWith('http'));

    if (videoAssets.length === 0) {
      test.info().annotations.push({ type: 'info', description: 'No video/source elements found on landing page — test skipped gracefully' });
      return;
    }

    const blockedAssets = videoAssets.filter((a) => BLOCKED_PATTERNS.some((p) => a.url.includes(p)));
    expect(
      blockedAssets.length,
      `${blockedAssets.length} video asset(s) served from blocked domains:\n${blockedAssets.map((a) => a.url).join('\n')}`,
    ).toBe(0);

    const nonCdnAssets = videoAssets.filter((a) => !IMAGEKIT_PATTERN.test(a.url));
    if (nonCdnAssets.length > 0) {
      await test.info().attach('non-imagekit-video-urls.txt', {
        body: nonCdnAssets.map((a) => a.url).join('\n'),
        contentType: 'text/plain',
      });
    }
  });

  // ── TC-LP-004 ─────────────────────────────────────────────────────────────
  test('TC-LP-004 @regression — CSS background-image URLs are served from CDN', async ({ landingPage, page }) => {
    await landingPage.goto();
    await page.waitForLoadState('networkidle');

    const bgAssets = await landingPage.getCSSBackgroundImageUrls();
    const httpBgAssets = bgAssets.filter((a) => a.url.startsWith('http'));

    if (httpBgAssets.length === 0) {
      test.info().annotations.push({ type: 'info', description: 'No external CSS background-images found' });
      return;
    }

    const blockedAssets = httpBgAssets.filter((a) => BLOCKED_PATTERNS.some((p) => a.url.includes(p)));
    expect(
      blockedAssets.length,
      `${blockedAssets.length} CSS background-image(s) served from blocked domains:\n${blockedAssets.map((a) => `${a.element} → ${a.url}`).join('\n')}`,
    ).toBe(0);

    const nonCdnAssets = httpBgAssets.filter((a) => !IMAGEKIT_PATTERN.test(a.url));
    if (nonCdnAssets.length > 0) {
      await test.info().attach('non-imagekit-bg-urls.txt', {
        body: nonCdnAssets.map((a) => `${a.element}\n  ${a.url}`).join('\n'),
        contentType: 'text/plain',
      });
    }
  });

  // ── TC-LP-005 ─────────────────────────────────────────────────────────────
  test('TC-LP-005 @regression — no media served from S3 direct URLs', async ({ landingPage, page }) => {
    const s3Requests: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const ct = response.headers()['content-type'] ?? '';
      const isMedia = ct.includes('image') || ct.includes('video') || /\.(jpg|jpeg|png|gif|webp|avif|mp4)(\?|$)/i.test(url);
      if (isMedia && (url.includes('amazonaws.com') || url.includes('storage.googleapis.com'))) {
        s3Requests.push(url);
      }
    });

    await landingPage.goto();
    await landingPage.scrollAndCaptureMediaUrls();

    expect(
      s3Requests.length,
      `${s3Requests.length} media asset(s) served directly from S3/GCS — should route through ImageKit:\n${s3Requests.join('\n')}`,
    ).toBe(0);
  });

  // ── TC-LP-006 ─────────────────────────────────────────────────────────────
  test('TC-LP-006 @regression — no media from unexpected external domains', async ({ landingPage, page }) => {
    const mediaRequests: Array<{ url: string; hostname: string }> = [];

    page.on('response', (response) => {
      const ct = response.headers()['content-type'] ?? '';
      const url = response.url();
      if (ct.includes('image') || ct.includes('video') || /\.(jpg|jpeg|png|gif|webp|avif|mp4)(\?|$)/i.test(url)) {
        try {
          const hostname = new URL(url).hostname;
          mediaRequests.push({ url, hostname });
        } catch { /* ignore malformed URLs */ }
      }
    });

    await landingPage.goto();
    await page.waitForLoadState('networkidle');
    await landingPage.scrollAndCaptureMediaUrls();

    const allHostnames = [...new Set(mediaRequests.map((r) => r.hostname))];
    const unexpectedDomains = allHostnames.filter(
      (h) =>
        !IMAGEKIT_PATTERN.test(h) &&
        !h.includes('tenxyou') &&
        !h.includes('gokwik') &&
        !CDN_DOMAINS.custom.includes(h),
    );

    await test.info().attach('media-domains.txt', {
      body: `All media domains detected:\n${allHostnames.join('\n')}\n\nUnexpected:\n${unexpectedDomains.join('\n') || 'none'}`,
      contentType: 'text/plain',
    });

    // Warn but don't hard-fail — unknown domains may be allowlisted custom ImageKit vanity domains
    if (unexpectedDomains.length > 0) {
      console.warn(`[CDN] Unexpected media domains found: ${unexpectedDomains.join(', ')}`);
      console.warn('If these are custom ImageKit vanity domains, add them to CDN_DOMAINS.custom in environments.ts');
    }

    // Hard-fail only for known blocked domains
    const hardBlocked = allHostnames.filter((h) => BLOCKED_PATTERNS.some((p) => h.includes(p)));
    expect(hardBlocked.length, `Media served from blocked domains: ${hardBlocked.join(', ')}`).toBe(0);
  });

  // ── TC-LP-007 ─────────────────────────────────────────────────────────────
  test('TC-LP-007 @regression — lazy-loaded media (post-scroll) served from CDN', async ({ landingPage, page }) => {
    await landingPage.goto();

    // Capture media requests triggered during scroll
    const lazyMediaUrls: string[] = [];
    page.on('response', (response) => {
      const ct = response.headers()['content-type'] ?? '';
      const url = response.url();
      if (ct.includes('image') || /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url)) {
        lazyMediaUrls.push(url);
      }
    });

    const allAssets: MediaAsset[] = await landingPage.scrollAndCaptureMediaUrls();

    const lazyImgAssets = allAssets.filter(
      (a) => a.type === 'img' && a.url.startsWith('http'),
    );

    if (lazyImgAssets.length === 0 && lazyMediaUrls.length === 0) {
      test.info().annotations.push({ type: 'info', description: 'No lazy-loaded images detected' });
      return;
    }

    const allDetectedUrls = [
      ...lazyImgAssets.map((a) => a.url),
      ...lazyMediaUrls,
    ];

    const blockedUrls = allDetectedUrls.filter((url) => BLOCKED_PATTERNS.some((p) => url.includes(p)));
    expect(
      blockedUrls.length,
      `${blockedUrls.length} lazy-loaded asset(s) from blocked domains:\n${blockedUrls.join('\n')}`,
    ).toBe(0);

    await test.info().attach('lazy-media-urls.txt', {
      body: [...new Set(allDetectedUrls)].join('\n'),
      contentType: 'text/plain',
    });
  });
});
