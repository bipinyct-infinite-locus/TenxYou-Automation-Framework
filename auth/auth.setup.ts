/**
 * GoKwik OTP-based auth setup.
 *
 * Strategy: Manual one-time login saves storageState.json.
 * Subsequent test runs reuse the saved session.
 *
 * If storageState.json exists and session is valid → skip.
 * If missing or expired → pause for manual OTP entry, then save session.
 */
import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { STORAGE_STATE } from '../playwright.config';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance('auth-setup');
const PHONE = process.env.AUTH_PHONE || '9999999999';

setup('authenticate user via GoKwik OTP', async ({ page }) => {
  // ── 1. Check if valid session already exists ────────────────────────────────
  if (fs.existsSync(STORAGE_STATE)) {
    const stateRaw = fs.readFileSync(STORAGE_STATE, 'utf-8');
    const state = JSON.parse(stateRaw);
    const hasValidState =
      state?.cookies?.length > 0 ||
      state?.origins?.some((o: any) =>
        o.localStorage?.some(
          (ls: any) => ls.name === 'isLoggedIn' && ls.value === 'true',
        ),
      );

    if (hasValidState) {
      logger.info('Valid session found — skipping auth setup');
      return;
    }
    logger.warn('Session found but appears expired — re-authenticating');
  }

  // ── 2. Navigate and trigger GoKwik login ───────────────────────────────────
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Click login/account icon in header
  const loginTriggers = [
    '[data-testid="login-btn"]',
    '[aria-label*="account" i]',
    '[aria-label*="login" i]',
    '[aria-label*="user" i]',
    'button:has-text("Login")',
    'button:has-text("Sign In")',
  ];

  let loginClicked = false;
  for (const selector of loginTriggers) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      loginClicked = true;
      break;
    }
  }

  if (!loginClicked) {
    logger.warn('No login button found — GoKwik may auto-trigger on checkout');
    await page.goto('/gender/men');
  }

  // ── 3. Wait for GoKwik OTP modal ────────────────────────────────────────────
  // GoKwik renders in an iframe or overlay
  await page.waitForTimeout(2000);

  const phoneSelectors = [
    'input[type="tel"]',
    'input[placeholder*="phone" i]',
    'input[placeholder*="mobile" i]',
    'input[name="phone"]',
    '#phone',
  ];

  let phoneInput = null;
  for (const sel of phoneSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
      phoneInput = el;
      break;
    }
  }

  if (phoneInput) {
    await phoneInput.fill(PHONE);
    // Submit phone to request OTP
    const submitBtn = page.locator('button[type="submit"], button:has-text("Send OTP"), button:has-text("Continue")').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
    }
  }

  // ── 4. Pause for manual OTP entry ───────────────────────────────────────────
  logger.info('═══════════════════════════════════════════════');
  logger.info('MANUAL ACTION REQUIRED:');
  logger.info(`1. Check your phone (${PHONE}) for the OTP`);
  logger.info('2. Enter the OTP in the browser window');
  logger.info('3. Complete the login flow');
  logger.info('4. Press Enter here once logged in');
  logger.info('═══════════════════════════════════════════════');

  // In headed mode: pause for user input; in CI: use a pre-existing state
  if (process.env.CI) {
    throw new Error(
      'CI auth setup requires a pre-populated auth/storageState.json. ' +
      'Run auth setup locally first, commit storageState.json, and use it in CI.',
    );
  }

  await page.pause();

  // ── 5. Verify login succeeded ───────────────────────────────────────────────
  const isLoggedIn = await page.evaluate((): boolean => {
    return (
      (window as Window & { localStorage: Storage }).localStorage.getItem('isLoggedIn') === 'true' ||
      (document as Document).cookie.includes('gokwik') ||
      (document as Document).cookie.includes('session') ||
      (document as Document).cookie.includes('auth')
    );
  });

  if (!isLoggedIn) {
    logger.warn('Login state unclear — saving state anyway');
  } else {
    logger.info('Login confirmed ✓');
  }

  // ── 6. Save session state ────────────────────────────────────────────────────
  const stateDir = path.dirname(STORAGE_STATE);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  await page.context().storageState({ path: STORAGE_STATE });
  logger.info(`Session saved to: ${STORAGE_STATE}`);
});
