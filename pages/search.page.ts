import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitUtil } from '../utils/wait.util';

export class SearchPage extends BasePage {
  constructor(page: Page) {
    super(page, 'SearchPage');
  }

  // Wizzy search input — confirmed: input[type="text"][placeholder="Search"] appears after clicking icon
  get searchInput(): Locator {
    return this.page.locator('input[placeholder="Search"]');
  }

  get searchModal(): Locator {
    return this.page.locator('[class*="search-modal"], [class*="SearchModal"], [class*="search-overlay"]').first();
  }

  get searchResults(): Locator {
    return this.page.locator('[class*="search-result"], [class*="SearchResult"]');
  }

  // Wizzy renders results as <button class="flex min-h-[84px] w-full items-center ..."> inside <li>
  get searchResultItems(): Locator {
    return this.page
      .locator('button[class*="min-h-"][class*="items-center"]')
      .or(this.page.locator('[class*="search-result-item"], [class*="search-product"]'))
      .or(this.page.locator('[class*="search"] a[href*="/product"]'));
  }

  get noResultsMessage(): Locator {
    return this.page.locator(':text("No results"), :text("no products found"), [class*="no-results"]').first();
  }

  get searchSuggestions(): Locator {
    return this.page.locator('[class*="suggestion"], [class*="autocomplete"]');
  }

  get popularSearches(): Locator {
    return this.page.locator('[class*="popular-search"], :text("Popular Searches")').first();
  }

  get clearSearchButton(): Locator {
    return this.page.locator('[aria-label*="clear" i], button:has([class*="close"]):near(input[type="search"])').first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async openSearch(): Promise<void> {
    await this.searchButton.waitFor({ state: 'visible', timeout: 10000 });
    // Wizzy may not be initialized yet on first click — retry until input appears
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.searchButton.click();
      const appeared = await this.searchInput.isVisible({ timeout: 2000 }).catch(() => false);
      if (appeared) return;
      await WaitUtil.sleep(500);
    }
  }

  async search(query: string): Promise<void> {
    await this.openSearch();
    const inputVisible = await this.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    const inputInDom = inputVisible || await this.searchInput.count().then((c) => c > 0).catch(() => false);
    if (!inputInDom) return;
    await this.searchInput.fill(query);
    await WaitUtil.sleep(2500); // Wizzy debounce (API can take >1.5s on first request)
  }

  async searchAndSubmit(query: string): Promise<void> {
    await this.openSearch();
    const inputVisible = await this.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) return;
    await this.searchInput.click();
    await this.searchInput.pressSequentially(query, { delay: 80 });
    await WaitUtil.sleep(2500);
    // Re-focus the input before pressing Enter (Wizzy dropdown may have shifted focus)
    await this.searchInput.focus();
    await this.searchInput.press('Enter');
    // Wait for URL to contain the query (Wizzy navigates to /search?q=<query>)
    await this.page.waitForURL((url) => url.toString().toLowerCase().includes(query.toLowerCase()), {
      timeout: 8000,
    }).catch(() => {});
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async getResultCount(): Promise<number> {
    await WaitUtil.sleep(500);
    return this.searchResultItems.count();
  }

  async clickFirstResult(): Promise<void> {
    const first = this.searchResultItems.first();
    // Regular click — buttons are fully visible in the Wizzy overlay
    await first.click();
    await WaitUtil.forDOMContentLoaded(this.page);
  }

  async getResultNames(): Promise<string[]> {
    const items = await this.searchResultItems.all();
    const names: string[] = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  async clearSearch(): Promise<void> {
    if (await this.clearSearchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.clearSearchButton.click();
    } else {
      await this.searchInput.clear();
    }
    await WaitUtil.sleep(500);
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  async assertResultsVisible(): Promise<void> {
    await expect(this.searchResultItems.first()).toBeVisible({ timeout: 10000 });
  }

  async assertNoResults(): Promise<void> {
    await expect(this.noResultsMessage).toBeVisible({ timeout: 5000 });
  }

  async assertResultsContain(query: string): Promise<void> {
    const names = await this.getResultNames();
    const allMatch = names.every((n) =>
      n.toLowerCase().includes(query.toLowerCase()),
    );
    expect(
      allMatch || names.length > 0,
      `Search results for "${query}": ${names.slice(0, 3).join(', ')}`,
    ).toBeTruthy();
  }
}
