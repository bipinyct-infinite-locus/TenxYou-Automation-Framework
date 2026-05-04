import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { ENV, API_ENDPOINTS } from '../../config/environments';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance('APIClient');

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  failOnStatusCode?: boolean;
}

export class APIClient {
  private readonly baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'en-IN',
  };

  constructor(private readonly request: APIRequestContext) {}

  // ── Core HTTP Methods ────────────────────────────────────────────────────
  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<{ status: number; body: T }> {
    const start = Date.now();
    const res = await this.request.get(this.resolveURL(url), {
      headers: { ...this.baseHeaders, ...options.headers },
      params: options.params as Record<string, string | number | boolean>,
      timeout: options.timeout ?? 15000,
      failOnStatusCode: options.failOnStatusCode ?? false,
    });
    const body = await this.parseBody<T>(res);
    logger.api('GET', url, res.status(), Date.now() - start);
    return { status: res.status(), body };
  }

  async post<T = unknown>(url: string, data?: unknown, options: RequestOptions = {}): Promise<{ status: number; body: T }> {
    const start = Date.now();
    const res = await this.request.post(this.resolveURL(url), {
      headers: { ...this.baseHeaders, ...options.headers },
      data: data as Record<string, unknown>,
      timeout: options.timeout ?? 15000,
      failOnStatusCode: options.failOnStatusCode ?? false,
    });
    const body = await this.parseBody<T>(res);
    logger.api('POST', url, res.status(), Date.now() - start);
    return { status: res.status(), body };
  }

  async put<T = unknown>(url: string, data?: unknown, options: RequestOptions = {}): Promise<{ status: number; body: T }> {
    const start = Date.now();
    const res = await this.request.put(this.resolveURL(url), {
      headers: { ...this.baseHeaders, ...options.headers },
      data: data as Record<string, unknown>,
      timeout: options.timeout ?? 15000,
      failOnStatusCode: options.failOnStatusCode ?? false,
    });
    const body = await this.parseBody<T>(res);
    logger.api('PUT', url, res.status(), Date.now() - start);
    return { status: res.status(), body };
  }

  async delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<{ status: number; body: T }> {
    const start = Date.now();
    const res = await this.request.delete(this.resolveURL(url), {
      headers: { ...this.baseHeaders, ...options.headers },
      timeout: options.timeout ?? 15000,
      failOnStatusCode: options.failOnStatusCode ?? false,
    });
    const body = await this.parseBody<T>(res);
    logger.api('DELETE', url, res.status(), Date.now() - start);
    return { status: res.status(), body };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private resolveURL(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/saleor')) return `${ENV.saleorApiURL}${url}`;
    if (url.startsWith('/api/site')) return `${ENV.strapiURL}${url.replace('/api/site', '')}`;
    return `${ENV.baseURL}${url}`;
  }

  private async parseBody<T>(res: APIResponse): Promise<T> {
    try {
      return (await res.json()) as T;
    } catch {
      return (await res.text()) as unknown as T;
    }
  }

  // ── Convenience wrappers ─────────────────────────────────────────────────
  async getPDPSlugs(): Promise<string[]> {
    const { body } = await this.get<unknown>(
      `${ENV.baseURL}${API_ENDPOINTS.pdpSlugs}`,
    );
    if (Array.isArray(body)) return body as string[];
    return [];
  }

  async getPLPSlugs(): Promise<string[]> {
    const { body } = await this.get<unknown>(
      `${ENV.baseURL}${API_ENDPOINTS.plpSlugs}`,
    );
    if (Array.isArray(body)) return body as string[];
    return [];
  }

  async getNavbarData(): Promise<unknown> {
    const { body } = await this.get(
      `${ENV.saleorApiURL}${API_ENDPOINTS.saleorNavbar}`,
    );
    return body;
  }

  async getOffers(payload?: unknown): Promise<unknown> {
    const { body } = await this.post(
      `${ENV.saleorApiURL}${API_ENDPOINTS.saleorOffers}`,
      payload || {},
    );
    return body;
  }

  async getSiteContent(): Promise<unknown> {
    const { body } = await this.get(
      `${ENV.strapiURL}/api/site-content?populate=*`,
    );
    return body;
  }
}
