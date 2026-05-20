import * as fs from 'fs';
import { APIRequestContext } from '@playwright/test';
import { ENV } from '../../config/environments';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance('BEApiClient');

export interface BERequestOptions {
  headers?: Record<string, string>;
  requireAuth?: boolean;
  timeout?: number;
  failOnStatusCode?: boolean;
}

export interface BEResponse<T = unknown> {
  status: number;
  body: T;
  durationMs: number;
}

interface StorageState {
  origins?: Array<{
    origin: string;
    localStorage?: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Auth-aware HTTP client for the TenxYou Backend REST API.
 *
 * Auth pattern mirrors the frontend beApiClient:
 *  - When requireAuth=true: injects  Authorization: Bearer {token}
 *                                    x-refresh-token: {refreshToken}
 *  - Auth is GoKwik OTP-based — tokens are read from auth/storageState.json
 *    written by the auth-setup project. Call setTokenFromStorageState() once.
 */
export class BEApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  private readonly base: string;
  private readonly defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  constructor(private readonly request: APIRequestContext) {
    this.base = ENV.beApiURL;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────

  /**
   * Reads user_token and refreshToken from Playwright storageState.json.
   * The file is written by auth/auth.setup.ts after a GoKwik OTP login.
   * Returns false if the file is missing or contains no token (tests skip).
   */
  setTokenFromStorageState(storageStatePath: string): boolean {
    if (!fs.existsSync(storageStatePath)) {
      logger.warn(`storageState.json not found at ${storageStatePath} — auth tests will be skipped`);
      return false;
    }

    let state: StorageState;
    try {
      state = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8')) as StorageState;
    } catch {
      logger.warn(`Failed to parse storageState.json — auth tests will be skipped`);
      return false;
    }

    // Match the origin to ENV.baseURL (ignore trailing slash differences)
    const baseOrigin = ENV.baseURL.replace(/\/$/, '');
    const origin = state.origins?.find(
      (o) => o.origin.replace(/\/$/, '') === baseOrigin,
    );

    const ls = origin?.localStorage ?? [];
    const token = ls.find((e) => e.name === 'user_token')?.value ?? null;
    const refresh = ls.find((e) => e.name === 'refreshToken')?.value ?? null;

    if (!token) {
      logger.warn(`user_token not found in storageState.json for origin ${baseOrigin} — auth tests will be skipped`);
      return false;
    }

    this.token = token;
    this.refreshToken = refresh;
    logger.info(`Token loaded from storageState.json ✓`);
    return true;
  }

  /** Clears stored tokens. */
  logout(): void {
    this.token = null;
    this.refreshToken = null;
  }

  /** Manually inject a token (e.g. from environment variable). */
  setToken(token: string, refreshToken?: string): void {
    this.token = token;
    if (refreshToken) this.refreshToken = refreshToken;
  }

  // ── Core HTTP ─────────────────────────────────────────────────────────────────

  async get<T = unknown>(path: string, opts: BERequestOptions = {}): Promise<BEResponse<T>> {
    const url = this.url(path);
    const headers = this.headers(opts);
    const start = Date.now();

    const res = await this.request.get(url, {
      headers,
      timeout: opts.timeout ?? 15000,
      failOnStatusCode: opts.failOnStatusCode ?? false,
    });

    const body = await this.parseBody<T>(res);
    const durationMs = Date.now() - start;
    logger.api('GET', path, res.status(), durationMs);
    return { status: res.status(), body, durationMs };
  }

  async post<T = unknown>(path: string, data?: unknown, opts: BERequestOptions = {}): Promise<BEResponse<T>> {
    const url = this.url(path);
    const headers = this.headers(opts);
    const start = Date.now();

    const res = await this.request.post(url, {
      headers,
      data: data as Record<string, unknown>,
      timeout: opts.timeout ?? 15000,
      failOnStatusCode: opts.failOnStatusCode ?? false,
    });

    const body = await this.parseBody<T>(res);
    const durationMs = Date.now() - start;
    logger.api('POST', path, res.status(), durationMs);
    return { status: res.status(), body, durationMs };
  }

  /**
   * Multipart form-data POST (returns & exchanges with file upload).
   * Pass `formData` as a plain object — file fields should be Buffer values.
   */
  async postForm<T = unknown>(path: string, formData: Record<string, string | Buffer>, opts: BERequestOptions = {}): Promise<BEResponse<T>> {
    const url = this.url(path);
    const start = Date.now();

    // Playwright's multipart API
    const res = await this.request.post(url, {
      headers: this.headers({ ...opts, headers: { ...opts.headers } }),
      multipart: formData as Record<string, string | { name: string; mimeType: string; buffer: Buffer }>,
      timeout: opts.timeout ?? 30000,
      failOnStatusCode: opts.failOnStatusCode ?? false,
    });

    const body = await this.parseBody<T>(res);
    const durationMs = Date.now() - start;
    logger.api('POST (multipart)', path, res.status(), durationMs);
    return { status: res.status(), body, durationMs };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private url(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.base}${path}`;
  }

  private headers(opts: BERequestOptions): Record<string, string> {
    const h: Record<string, string> = { ...this.defaultHeaders, ...opts.headers };
    if (opts.requireAuth) {
      if (!this.token) throw new Error('BEApiClient: requireAuth=true but no token set. Call setTokenFromStorageState() first or run the auth-setup project.');
      h['Authorization'] = `Bearer ${this.token}`;
      if (this.refreshToken) h['x-refresh-token'] = this.refreshToken;
    }
    return h;
  }

  private async parseBody<T>(res: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
    try {
      return (await res.json()) as T;
    } catch {
      return (await res.text()) as unknown as T;
    }
  }
}
