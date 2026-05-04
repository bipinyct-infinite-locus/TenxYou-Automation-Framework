import { Page, Route, Request, Response } from '@playwright/test';
import { Logger } from './logger';

const logger = Logger.getInstance('Network');

export interface ApiCall {
  url: string;
  method: string;
  requestBody?: unknown;
  responseStatus: number;
  responseBody?: unknown;
  duration: number;
}

export const NetworkUtil = {
  capturedCalls: [] as ApiCall[],

  startCapture(page: Page, urlPattern: string | RegExp): void {
    NetworkUtil.capturedCalls = [];
    page.on('response', async (response: Response) => {
      const url = response.url();
      const matches =
        typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      if (matches) {
        const request = response.request();
        let requestBody: unknown;
        let responseBody: unknown;
        try {
          requestBody = request.postDataJSON();
        } catch {}
        try {
          responseBody = await response.json();
        } catch {}
        NetworkUtil.capturedCalls.push({
          url,
          method: request.method(),
          requestBody,
          responseStatus: response.status(),
          responseBody,
          duration: 0,
        });
        logger.api(request.method(), url, response.status());
      }
    });
  },

  async mockRoute(
    page: Page,
    urlPattern: string | RegExp,
    response: {
      status?: number;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<void> {
    await page.route(urlPattern, (route: Route) => {
      route.fulfill({
        status: response.status || 200,
        contentType: 'application/json',
        headers: response.headers,
        body: JSON.stringify(response.body),
      });
    });
  },

  async interceptAndModify(
    page: Page,
    urlPattern: string | RegExp,
    modifier: (body: unknown) => unknown,
  ): Promise<void> {
    await page.route(urlPattern, async (route: Route) => {
      const originalResponse = await route.fetch();
      let body: unknown;
      try {
        body = await originalResponse.json();
      } catch {
        body = {};
      }
      const modified = modifier(body);
      await route.fulfill({
        response: originalResponse,
        body: JSON.stringify(modified),
      });
    });
  },

  getCalls(urlSubstring: string): ApiCall[] {
    return NetworkUtil.capturedCalls.filter((c) =>
      c.url.includes(urlSubstring),
    );
  },
};
