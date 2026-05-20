import { APIRequestContext } from '@playwright/test';
import { CACHE_CONFIG } from '../config/environments';
import { Logger } from './logger';
import { WaitUtil } from './wait.util';

const logger = Logger.getInstance('CacheUtil');

/**
 * Clears the TenxYou frontend cache by calling the Saleor proxy clear-cache endpoint.
 *
 * Three prefixes must be cleared in sequence:
 *   "p"             → product cache
 *   "v"             → variant cache
 *   "cache:vouchers" → voucher cache
 *
 * Endpoint: POST <CACHE_CLEAR_URL>
 * Body:     { "cache_key_prefix": "<prefix>" }
 * Headers:  ngrok-skip-browser-warning, priority
 */
export const CacheUtil = {
  async clearAll(request: APIRequestContext): Promise<void> {
    logger.info(`Clearing frontend cache at ${CACHE_CONFIG.clearURL}`);
    for (const prefix of CACHE_CONFIG.prefixes) {
      await CacheUtil.clearPrefix(request, prefix);
    }
    logger.info(
      `Cache cleared (${CACHE_CONFIG.prefixes.join(', ')}). Waiting ${CACHE_CONFIG.propagationDelay}ms for propagation.`,
    );
    await WaitUtil.sleep(CACHE_CONFIG.propagationDelay);
  },

  async clearPrefix(request: APIRequestContext, prefix: string): Promise<void> {
    const start = Date.now();
    try {
      const res = await request.post(CACHE_CONFIG.clearURL, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          priority: 'u=1, i',
        },
        data: { cache_key_prefix: prefix },
        timeout: 15000,
        failOnStatusCode: false,
      });
      const duration = Date.now() - start;
      if (res.ok()) {
        logger.info(`Cache cleared prefix="${prefix}" → ${res.status()} (${duration}ms)`);
      } else {
        const body = await res.text().catch(() => '');
        logger.warn(`Cache clear prefix="${prefix}" returned ${res.status()}: ${body.slice(0, 200)}`);
      }
    } catch (err) {
      logger.warn(
        `Cache clear prefix="${prefix}" failed: ${(err as Error).message}. Continuing anyway.`,
      );
    }
  },

  async clearVouchersOnly(request: APIRequestContext): Promise<void> {
    await CacheUtil.clearPrefix(request, 'cache:vouchers');
    await WaitUtil.sleep(CACHE_CONFIG.propagationDelay);
  },
};
