import { expect } from '@playwright/test';
import Ajv, { Schema } from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

export const ResponseValidator = {
  assertStatus(actual: number, expected: number): void {
    expect(actual, `Expected HTTP ${expected} but got ${actual}`).toBe(expected);
  },

  assertStatusIn(actual: number, expected: number[]): void {
    expect(expected, `Expected HTTP status in [${expected.join(', ')}] but got ${actual}`).toContain(actual);
  },

  assertBodyNotEmpty(body: unknown): void {
    expect(body, 'Response body should not be empty').toBeTruthy();
  },

  assertBodyIsArray(body: unknown): void {
    expect(Array.isArray(body), 'Expected response body to be an array').toBeTruthy();
  },

  assertArrayNotEmpty(body: unknown): void {
    ResponseValidator.assertBodyIsArray(body);
    expect((body as unknown[]).length, 'Response array should not be empty').toBeGreaterThan(0);
  },

  assertHasField(body: Record<string, unknown>, field: string): void {
    expect(body, `Response should have field "${field}"`).toHaveProperty(field);
  },

  assertFieldValue(body: Record<string, unknown>, field: string, value: unknown): void {
    expect(body[field], `Field "${field}" should be "${value}"`).toBe(value);
  },

  assertSchema(body: unknown, schema: Schema): void {
    const validate = ajv.compile(schema);
    const valid = validate(body);
    if (!valid) {
      const errors = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ');
      throw new Error(`Schema validation failed: ${errors}`);
    }
  },

  assertResponseTime(durationMs: number, maxMs: number): void {
    expect(durationMs, `Response time ${durationMs}ms exceeded ${maxMs}ms`).toBeLessThanOrEqual(maxMs);
  },

  assertNoErrorField(body: Record<string, unknown>): void {
    const hasError =
      body.error !== undefined ||
      body.errors !== undefined ||
      body.message?.toString().toLowerCase().includes('error');
    expect(hasError, `Response contains error: ${JSON.stringify(body)}`).toBeFalsy();
  },
};
