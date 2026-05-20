import { Page, CDPSession } from '@playwright/test';

export interface WebVitals {
  fcp: number;             // First Contentful Paint (ms)
  lcp: number;             // Largest Contentful Paint (ms)
  cls: number;             // Cumulative Layout Shift score
  tbt: number;             // Total Blocking Time approximation (ms)
  ttfb: number;            // Time to First Byte (ms)
  domContentLoaded: number; // DOMContentLoaded event (ms from nav start)
  fullyLoaded: number;     // load event end (ms from nav start)
}

export interface ResourceSummary {
  totalRequests: number;
  totalTransferBytes: number;
  totalImageBytes: number;
  totalJSBytes: number;
  totalCSSBytes: number;
  slowestRequests: Array<{ url: string; duration: number }>;
  failedRequests: Array<{ url: string; status: number }>;
}

export type NetworkProfile = 'slow3g' | 'fast4g' | 'none';

const NETWORK_PROFILES: Record<NetworkProfile, { downloadThroughput: number; uploadThroughput: number; latency: number }> = {
  slow3g: {
    downloadThroughput: Math.floor(500 * 1024 / 8),   // 500 kbps
    uploadThroughput:   Math.floor(500 * 1024 / 8),
    latency: 400,
  },
  fast4g: {
    downloadThroughput: Math.floor(4 * 1024 * 1024 / 8),  // 4 Mbps
    uploadThroughput:   Math.floor(3 * 1024 * 1024 / 8),
    latency: 20,
  },
  none: {
    downloadThroughput: -1,
    uploadThroughput:   -1,
    latency: 0,
  },
};

/**
 * Applies Chrome DevTools Protocol network throttling to the given page.
 * Must be called BEFORE navigation for throttling to take effect.
 */
export async function throttleNetwork(page: Page, profile: NetworkProfile): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  const params = NETWORK_PROFILES[profile];
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: params.downloadThroughput,
    uploadThroughput:   params.uploadThroughput,
    latency:            params.latency,
  });
  return client;
}

/**
 * Collects Web Vitals via PerformanceObserver + window.performance.
 * Call AFTER navigation is complete. Waits up to 4s for LCP/CLS observers to fire.
 */
export async function collectWebVitals(page: Page): Promise<WebVitals> {
  return page.evaluate((): Promise<WebVitals> => {
    return new Promise((resolve) => {
      let lcp = 0;
      let cls = 0;
      let tbt = 0;

      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) lcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch { /* not supported */ }

      try {
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!(entry as PerformanceEventTiming & { hadRecentInput: boolean }).hadRecentInput) {
              cls += (entry as PerformanceEventTiming & { value: number }).value;
            }
          });
        }).observe({ type: 'layout-shift', buffered: true });
      } catch { /* not supported */ }

      try {
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            tbt += Math.max(0, entry.duration - 50);
          });
        }).observe({ type: 'longtask', buffered: true });
      } catch { /* not supported */ }

      setTimeout(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime ?? 0;
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const ttfb = nav?.responseStart ?? 0;
        const domContentLoaded = nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
        const fullyLoaded = nav ? nav.loadEventEnd - nav.startTime : 0;

        resolve({ fcp, lcp, cls, tbt, ttfb, domContentLoaded, fullyLoaded });
      }, 4000);
    });
  });
}

/**
 * Collects resource-level summary: request count, byte sizes by type, slowest + failed requests.
 * Call after page.waitForLoadState('networkidle') for complete picture.
 */
export async function collectResourceSummary(page: Page): Promise<ResourceSummary> {
  return page.evaluate((): ResourceSummary => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    let totalTransferBytes = 0;
    let totalImageBytes = 0;
    let totalJSBytes = 0;
    let totalCSSBytes = 0;

    const durations: Array<{ url: string; duration: number }> = [];

    entries.forEach((entry) => {
      const size = entry.transferSize ?? 0;
      totalTransferBytes += size;
      if (entry.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i.test(entry.name)) {
        totalImageBytes += size;
      } else if (entry.initiatorType === 'script' || /\.js(\?|$)/i.test(entry.name)) {
        totalJSBytes += size;
      } else if (entry.initiatorType === 'link' && /\.css(\?|$)/i.test(entry.name)) {
        totalCSSBytes += size;
      }
      durations.push({ url: entry.name, duration: Math.round(entry.duration) });
    });

    const slowestRequests = durations
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalRequests: entries.length,
      totalTransferBytes,
      totalImageBytes,
      totalJSBytes,
      totalCSSBytes,
      slowestRequests,
      failedRequests: [], // populated separately via page.on('response')
    };
  });
}

/**
 * Formats WebVitals as a readable table string for test annotations / attachments.
 */
export function formatVitalsReport(label: string, vitals: WebVitals, resources: ResourceSummary): string {
  const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
  return [
    `=== Performance Report: ${label} ===`,
    `FCP              : ${vitals.fcp.toFixed(0)} ms`,
    `LCP              : ${vitals.lcp.toFixed(0)} ms`,
    `CLS              : ${vitals.cls.toFixed(4)}`,
    `TBT (approx)     : ${vitals.tbt.toFixed(0)} ms`,
    `TTFB             : ${vitals.ttfb.toFixed(0)} ms`,
    `DOM Content Loaded: ${vitals.domContentLoaded.toFixed(0)} ms`,
    `Fully Loaded     : ${vitals.fullyLoaded.toFixed(0)} ms`,
    `---`,
    `Total Requests   : ${resources.totalRequests}`,
    `Transfer Size    : ${kb(resources.totalTransferBytes)}`,
    `Image Weight     : ${kb(resources.totalImageBytes)}`,
    `JS Weight        : ${kb(resources.totalJSBytes)}`,
    `CSS Weight       : ${kb(resources.totalCSSBytes)}`,
    `---`,
    `Top 5 Slow Requests:`,
    ...resources.slowestRequests.slice(0, 5).map((r) => `  ${r.duration}ms  ${r.url.slice(-80)}`),
  ].join('\n');
}

/**
 * Performance budget thresholds (Good / Needs Improvement / Poor).
 */
export const PERF_BUDGETS = {
  desktop: { fcp: 1800, lcp: 2500, cls: 0.1, tbt: 200 },
  mobile:  { fcp: 3000, lcp: 4000, cls: 0.1, tbt: 600 },
  slow3g:  { fcp: 5000, lcp: 7000, cls: 0.25, tbt: 1500 },
} as const;
