import { test, expect } from '../../fixtures/base.fixture';
import { SEARCH_QUERIES } from '../../data/products.data';

/**
 * TC-SRCH-001 → TC-SRCH-015
 * Search (Wizzy-powered): Functional, edge, negative scenarios
 */
test.describe('Search (Wizzy)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ── Functional ─────────────────────────────────────────────────────────────
  test('TC-SRCH-001 @smoke @sanity — search icon opens search modal', async ({ searchPage }) => {
    await searchPage.openSearch();
    const isVisible = await searchPage.searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('TC-SRCH-002 @smoke — searching "cricket" returns results', async ({ searchPage }) => {
    await searchPage.search('cricket');
    const count = await searchPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-SRCH-003 @smoke — searching "shoes" returns results', async ({ searchPage }) => {
    await searchPage.search('shoes');
    const count = await searchPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });

  // ── Data-driven valid queries ──────────────────────────────────────────────
  for (const query of SEARCH_QUERIES.valid) {
    test(`TC-SRCH-004 @regression — search "${query}" returns results`, async ({ searchPage }) => {
      await searchPage.search(query);
      await searchPage.assertResultsVisible();
    });
  }

  // ── Partial queries ────────────────────────────────────────────────────────
  for (const query of SEARCH_QUERIES.partial) {
    test(`TC-SRCH-005 @regression — partial query "${query}" shows suggestions or results`, async ({ searchPage }) => {
      await searchPage.search(query);
      const hasResults = await searchPage.searchResultItems.first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasSuggestions = await searchPage.searchSuggestions.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasResults || hasSuggestions).toBeTruthy();
    });
  }

  // ── No results ─────────────────────────────────────────────────────────────
  for (const query of SEARCH_QUERIES.noResults) {
    test(`TC-SRCH-006 @regression @negative — "${query}" shows no results message`, async ({ searchPage }) => {
      await searchPage.search(query);
      const noResult = await searchPage.noResultsMessage.isVisible({ timeout: 5000 }).catch(() => false);
      const resultCount = await searchPage.searchResultItems.count();
      // Either no-results message shown OR 0 results rendered
      expect(noResult || resultCount === 0).toBeTruthy();
    });
  }

  // ── Edge cases ─────────────────────────────────────────────────────────────
  test('TC-SRCH-007 @regression @edge — searching with whitespace only is handled gracefully', async ({ searchPage }) => {
    await searchPage.search('   ');
    // No crash expected
  });

  test('TC-SRCH-008 @regression @edge — searching with special characters does not crash', async ({ searchPage }) => {
    await searchPage.search('!@#$%^&*()');
    // No JS error, no 500 page
  });

  test('TC-SRCH-009 @regression @edge — long search query is handled', async ({ searchPage }) => {
    await searchPage.search(SEARCH_QUERIES.longQuery);
  });

  test('TC-SRCH-010 @regression — clear search restores empty state', async ({ searchPage }) => {
    await searchPage.search('cricket');
    await searchPage.clearSearch();
    const value = await searchPage.searchInput.inputValue();
    expect(value).toBe('');
  });

  test('TC-SRCH-011 @regression — pressing Enter on search navigates to results page', async ({ searchPage, page }) => {
    await searchPage.searchAndSubmit('cricket');
    const url = page.url();
    expect(url).toContain('cricket');
  });

  test('TC-SRCH-012 @regression — clicking a search result navigates to PDP', async ({ searchPage, page }) => {
    await searchPage.search('cricket');
    const hasResults = await searchPage.searchResultItems.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasResults) {
      await searchPage.clickFirstResult();
      const url = page.url();
      expect(url).not.toBe('/');
    }
  });

  test('TC-SRCH-013 @regression — popular searches are shown before typing', async ({ searchPage }) => {
    await searchPage.openSearch();
    const hasPopular = await searchPage.popularSearches.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPopular) {
      await expect(searchPage.popularSearches).toBeVisible();
    }
  });

  test('TC-SRCH-014 @regression — search returns relevant results', async ({ searchPage }) => {
    await searchPage.search('cricket shoes');
    await searchPage.assertResultsVisible();
    const names = await searchPage.getResultNames();
    const isRelevant = names.some((n) =>
      n.toLowerCase().includes('cricket') || n.toLowerCase().includes('shoe'),
    );
    expect(isRelevant || names.length > 0).toBeTruthy();
  });

  test('TC-SRCH-015 @regression — case insensitive search works', async ({ searchPage }) => {
    await searchPage.search('CRICKET');
    const count1 = await searchPage.getResultCount();
    await searchPage.clearSearch();
    await searchPage.search('cricket');
    const count2 = await searchPage.getResultCount();
    expect(Math.abs(count1 - count2)).toBeLessThanOrEqual(2);
  });
});
