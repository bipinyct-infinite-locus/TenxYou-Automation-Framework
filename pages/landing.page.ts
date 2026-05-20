import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';
import { LANDING_PAGES } from '../config/environments';

export interface MediaAsset {
  url: string;
  type: 'img' | 'video' | 'source' | 'css-background';
  element: string;
}

export class LandingPage extends BasePage {
  constructor(page: Page) {
    super(page, 'LandingPage');
  }

  // ── CTA Locators ──────────────────────────────────────────────────────────
  get knowMoreButton(): Locator {
    return this.page
      .getByRole('link', { name: /know more/i })
      .or(this.page.getByRole('button', { name: /know more/i }))
      .first();
  }

  get orderNowButton(): Locator {
    return this.page
      .getByRole('link', { name: /order now/i })
      .or(this.page.getByRole('button', { name: /order now/i }))
      .first();
  }

  // ── Media Locators ────────────────────────────────────────────────────────
  get allImages(): Locator {
    return this.page.locator('img[src], img[data-src], img[srcset]');
  }

  get allVideos(): Locator {
    return this.page.locator('video, video source');
  }

  get heroBanner(): Locator {
    return this.page
      .locator('[class*="hero"], [class*="Hero"], [class*="banner"], [class*="Banner"]')
      .first();
  }

  get lazyImages(): Locator {
    return this.page.locator('img[data-src], img[loading="lazy"], img[data-lazy]');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto(LANDING_PAGES.nativeBombayBlue, { waitUntil: 'domcontentloaded' });
    await WaitUtil.sleep(1000);
  }

  async clickKnowMore(): Promise<void> {
    await this.knowMoreButton.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
      this.knowMoreButton.click(),
    ]);
    await WaitUtil.sleep(1000);
  }

  async clickOrderNow(): Promise<void> {
    await this.orderNowButton.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
      this.orderNowButton.click(),
    ]);
    await WaitUtil.sleep(1000);
  }

  /**
   * Collects all media src/srcset values from img, video, source elements (including lazy-loaded).
   */
  async getAllMediaSrcs(): Promise<MediaAsset[]> {
    return this.page.evaluate((): MediaAsset[] => {
      const assets: MediaAsset[] = [];

      document.querySelectorAll('img').forEach((el) => {
        const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
        const srcset = el.getAttribute('srcset') || el.getAttribute('data-srcset') || '';
        if (src && !src.startsWith('data:')) {
          assets.push({ url: src, type: 'img', element: el.outerHTML.slice(0, 120) });
        }
        if (srcset) {
          srcset.split(',')
            .map((s) => s.trim().split(/\s+/)[0])
            .filter((u) => u && !u.startsWith('data:'))
            .forEach((u) => assets.push({ url: u, type: 'img', element: 'srcset' }));
        }
      });

      document.querySelectorAll('video').forEach((el) => {
        const src = el.getAttribute('src') || '';
        if (src && !src.startsWith('data:')) {
          assets.push({ url: src, type: 'video', element: el.outerHTML.slice(0, 120) });
        }
      });

      document.querySelectorAll('source').forEach((el) => {
        const src = el.getAttribute('src') || '';
        const srcset = el.getAttribute('srcset') || '';
        if (src && !src.startsWith('data:')) {
          assets.push({ url: src, type: 'source', element: el.outerHTML.slice(0, 120) });
        }
        if (srcset) {
          srcset.split(',')
            .map((s) => s.trim().split(/\s+/)[0])
            .filter((u) => u && !u.startsWith('data:'))
            .forEach((u) => assets.push({ url: u, type: 'source', element: 'srcset' }));
        }
      });

      return assets;
    });
  }

  /**
   * Extracts all CSS background-image URLs from every rendered element on the page.
   */
  async getCSSBackgroundImageUrls(): Promise<MediaAsset[]> {
    return this.page.evaluate((): MediaAsset[] => {
      const assets: MediaAsset[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
          const matches = bg.match(/url\(["']?([^"')]+)["']?\)/g) || [];
          matches.forEach((m) => {
            const url = m.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            if (url && !url.startsWith('data:')) {
              assets.push({
                url,
                type: 'css-background',
                element: `<${el.tagName.toLowerCase()} class="${(el as HTMLElement).className.toString().slice(0, 60)}">`,
              });
            }
          });
        }
      });
      return assets;
    });
  }

  /**
   * Scrolls the full page to trigger lazy loading, then re-collects all media assets.
   */
  async scrollAndCaptureMediaUrls(): Promise<MediaAsset[]> {
    const viewportHeight = await this.page.evaluate(() => window.innerHeight);
    const pageHeight = await this.page.evaluate(() => document.body.scrollHeight);
    let position = 0;

    while (position < pageHeight) {
      position = Math.min(position + viewportHeight, pageHeight);
      await this.page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), position);
      await WaitUtil.sleep(700);
    }

    await this.page.evaluate(() => window.scrollTo(0, 0));
    await WaitUtil.sleep(500);

    const [imgAssets, bgAssets] = await Promise.all([
      this.getAllMediaSrcs(),
      this.getCSSBackgroundImageUrls(),
    ]);
    return [...imgAssets, ...bgAssets];
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertKnowMoreVisible(): Promise<void> {
    await expect(this.knowMoreButton).toBeVisible({ timeout: 10000 });
  }

  async assertOrderNowVisible(): Promise<void> {
    await expect(this.orderNowButton).toBeVisible({ timeout: 10000 });
  }

  async assertHeroVisible(): Promise<void> {
    await expect(this.heroBanner).toBeVisible({ timeout: 10000 });
  }
}
