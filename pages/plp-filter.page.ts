import { Page, Locator, expect } from '@playwright/test';
import { PLPPage } from './plp.page';
import { WaitUtil } from '../utils/wait.util';

/**
 * PLPFilterPage — extends PLPPage with all Filter System locators, actions,
 * and assertions for TXY-Filters PRD (PRD-070526-143651).
 *
 * DOM reality (crawled 2026-05-08):
 *  - PLP routes: /collection/men-apparel/183, /collection/women-apparel/184
 *  - Filters are <fieldset> elements — Sort, Accessories Size, Waist Size, T-Shirt Size, Fit, Color
 *  - Color swatches: <button aria-pressed="false|true" aria-label="Black|White|...">
 *  - Size options:   <button> with text content (class border changes when selected)
 *  - Sort options:   <button> inside Sort fieldset ("Price- High to Low" / "Price- Low to High")
 *  - Mobile button:  "Filter & Sort" button (responsive bottom bar)
 *  - Mobile drawer:  fixed overlay with same fieldsets; has Apply button, no Clear button
 *  - Clear All:      "Clear All >" button appears in product grid header AFTER a filter is applied
 *  - URL state:      ?filters={"color":["Black"]}&sort=price_desc  (JSON-encoded)
 *  - Escape key:     closes the mobile filter drawer
 */
export class PLPFilterPage extends PLPPage {
  constructor(page: Page) {
    super(page);
  }

  // ── Desktop Filter Sidebar ───────────────────────────────────────────────────

  get filterSidebar(): Locator {
    return this.page
      .locator('fieldset')
      .filter({ has: this.page.locator('legend') })
      .first();
  }

  get colorFilterSection(): Locator {
    return this.page
      .locator('fieldset')
      .filter({ has: this.page.locator('span', { hasText: /^Color$/i }) });
  }

  get colorSwatches(): Locator {
    return this.colorFilterSection.locator('button[aria-label]');
  }

  colorSwatchByName(name: string): Locator {
    return this.page
      .locator(`button[aria-label="${name}"]`)
      .or(this.page.locator(`[aria-label="${name}"]`))
      .first();
  }

  get sizeFilterSection(): Locator {
    return this.page
      .locator('fieldset')
      .filter({ has: this.page.locator('span', { hasText: /Size/i }) })
      .first();
  }

  sizeFilterOption(size: string): Locator {
    return this.page
      .locator('fieldset')
      .filter({ has: this.page.locator('span', { hasText: /Size/i }) })
      .locator('button', { hasText: new RegExp(`^${size}$`) })
      .first();
  }

  get activeFilterCountBadge(): Locator {
    return this.page
      .locator('[data-testid="active-filter-count"], [class*="filter-count"], [class*="badge"][class*="filter"]')
      .first();
  }

  // "Clear All >" appears in the product grid header after a filter is applied
  get clearAllFiltersButton(): Locator {
    return this.page
      .getByRole('button', { name: /clear all/i })
      .or(this.page.locator('[data-testid="clear-all-filters"]'))
      .first();
  }

  get sortDropdownControl(): Locator {
    return this.page
      .locator('fieldset')
      .filter({ has: this.page.locator('legend', { hasText: /^Sort$/i }) })
      .first();
  }

  sortOptionItem(label: string): Locator {
    return this.page
      .getByRole('button', { name: label, exact: true })
      .or(this.page.getByRole('button', { name: label, exact: false }))
      .first();
  }

  filterSectionByType(type: 'color' | 'size' | 'sort'): Locator {
    if (type === 'color') return this.colorFilterSection;
    if (type === 'sort')  return this.sortDropdownControl;
    return this.sizeFilterSection;
  }

  get noResultsMessage(): Locator {
    return this.page
      .locator('[data-testid="no-results"], [class*="no-results"], [class*="NoResults"]')
      .or(this.page.getByText(/no products found|no results found|0 products/i))
      .first();
  }

  // ── Mobile Filter Drawer ─────────────────────────────────────────────────────

  get mobileFilterButton(): Locator {
    return this.page
      .getByRole('button', { name: /filter.*sort|filter/i })
      .first();
  }

  // The drawer is the fixed-position overlay that slides up on mobile.
  // It contains the same fieldsets as the desktop sidebar.
  get filterDrawer(): Locator {
    return this.page
      .locator('[class*="fixed"][class*="inset"], [class*="fixed"][class*="bottom-0"]')
      .or(this.page.locator('[class*="drawer"], [class*="overlay"], [class*="sheet"]'))
      .filter({ has: this.page.locator('fieldset') })
      .first();
  }

  get applyFiltersButton(): Locator {
    return this.page
      .getByRole('button', { name: /^apply$/i })
      .or(this.page.locator('[data-testid="apply-filters"]'))
      .first();
  }

  // No Clear button exists in the mobile drawer on the current site build.
  // Kept for forward compatibility with future implementation.
  get clearFiltersInDrawerButton(): Locator {
    return this.page
      .getByRole('button', { name: /^clear$/i })
      .or(this.page.locator('[data-testid="clear-filters-drawer"]'))
      .first();
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Clicks a color swatch by name.
   * When the mobile filter drawer is open, scopes the click to the drawer
   * to avoid clicking the hidden desktop sidebar swatch behind the overlay.
   */
  async clickColorSwatch(name: string): Promise<void> {
    const drawerVisible = await this.filterDrawer.isVisible({ timeout: 300 }).catch(() => false);
    if (drawerVisible) {
      await this.filterDrawer.locator(`button[aria-label="${name}"]`).first().click();
    } else {
      await this.colorSwatchByName(name).click();
    }
    await WaitUtil.sleep(800);
  }

  /**
   * Clicks a size option button. Skips silently if the option is not present on
   * the current PLP (e.g., waist size "40" on an accessories page).
   */
  async clickSizeFilter(size: string): Promise<void> {
    const option = this.sizeFilterOption(size);
    const visible = await option.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await option.click();
      await WaitUtil.sleep(800);
    }
  }

  async selectSortOption(label: string): Promise<void> {
    await this.sortOptionItem(label).click();
    // Sort triggers a page re-render; wait for products to reload
    await WaitUtil.forDOMContentLoaded(this.page);
    await WaitUtil.sleep(2500);
  }

  async clearAllFilters(): Promise<void> {
    // "Clear All >" appears in the product grid header after a filter is applied
    await this.clearAllFiltersButton.waitFor({ timeout: 5000 });
    await this.clearAllFiltersButton.click();
    await WaitUtil.sleep(800);
  }

  async openFilterDrawer(): Promise<void> {
    await this.mobileFilterButton.click();
    await WaitUtil.sleep(800);
  }

  async applyFilters(): Promise<void> {
    await this.applyFiltersButton.click();
    await WaitUtil.sleep(1000);
  }

  async clearFiltersInDrawer(): Promise<void> {
    await this.clearFiltersInDrawerButton.click();
    await WaitUtil.sleep(500);
  }

  // Escape key closes the mobile drawer without applying selections.
  async closeDrawerWithoutApplying(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await WaitUtil.sleep(500);
  }

  async getActiveFilterCount(): Promise<number> {
    // Prefer an explicit badge if the site renders one
    const badge = this.activeFilterCountBadge;
    if (await badge.isVisible({ timeout: 1000 }).catch(() => false)) {
      const text = await badge.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    // Fall back: count swatches in the desktop color section that are aria-pressed=true
    return this.colorFilterSection.locator('button[aria-pressed="true"]').count();
  }

  async getColorSwatchCount(): Promise<number> {
    await this.colorFilterSection
      .waitFor({ timeout: 8000 })
      .catch(() => {});
    return this.colorSwatches.count();
  }

  /**
   * Determines whether a color swatch is in the selected state.
   * When the mobile drawer is open, checks the swatch inside the drawer.
   */
  async isColorSwatchActive(name: string): Promise<boolean> {
    const drawerVisible = await this.filterDrawer.isVisible({ timeout: 300 }).catch(() => false);
    const swatch = drawerVisible
      ? this.filterDrawer.locator(`button[aria-label="${name}"]`).first()
      : this.colorSwatchByName(name);
    const ariaPressed = await swatch.getAttribute('aria-pressed').catch(() => null);
    const classAttr   = await swatch.getAttribute('class').catch(() => null);
    return (
      ariaPressed === 'true' ||
      (classAttr?.includes('border-2') && classAttr?.includes('border-black')) === true
    );
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  async assertFilterSidebarVisible(): Promise<void> {
    await expect(this.filterSidebar).toBeVisible({ timeout: 8000 });
  }

  async assertColorFilterSectionVisible(): Promise<void> {
    await expect(this.colorFilterSection).toBeVisible({ timeout: 8000 });
  }

  async assertColorSwatchCount(expected: number): Promise<void> {
    await expect
      .poll(() => this.getColorSwatchCount(), { timeout: 8000 })
      .toBe(expected);
  }

  async assertColorSwatchVisible(name: string): Promise<void> {
    await expect(this.colorSwatchByName(name)).toBeVisible({ timeout: 5000 });
  }

  async assertColorSwatchActive(name: string): Promise<void> {
    const active = await this.isColorSwatchActive(name);
    expect(active, `Color swatch "${name}" should be in the active/selected state`).toBeTruthy();
  }

  async assertColorSwatchInactive(name: string): Promise<void> {
    const active = await this.isColorSwatchActive(name);
    expect(active, `Color swatch "${name}" should NOT be in the active/selected state`).toBeFalsy();
  }

  async assertSizeFilterSectionVisible(): Promise<void> {
    await expect(this.sizeFilterSection).toBeVisible({ timeout: 8000 });
  }

  async assertSortControlVisible(): Promise<void> {
    await expect(this.sortDropdownControl).toBeVisible({ timeout: 5000 });
  }

  async assertActiveFilterCount(expected: number): Promise<void> {
    await expect
      .poll(() => this.getActiveFilterCount(), { timeout: 5000 })
      .toBe(expected);
  }

  async assertURLContainsFilterParam(param: string, value?: string): Promise<void> {
    const pattern = value
      ? new RegExp(`[?&]${param}=.*${encodeURIComponent(value)}`)
      : new RegExp(`[?&]${param}=`);
    await expect(this.page).toHaveURL(pattern, { timeout: 5000 });
  }

  async assertNoProductsMessageVisible(): Promise<void> {
    await expect(this.noResultsMessage).toBeVisible({ timeout: 8000 });
  }

  async assertFilterDrawerVisible(): Promise<void> {
    await expect(this.filterDrawer).toBeVisible({ timeout: 5000 });
  }

  async assertFilterDrawerHidden(): Promise<void> {
    await expect(this.filterDrawer).not.toBeVisible({ timeout: 5000 });
  }

  async assertMobileFilterButtonVisible(): Promise<void> {
    await expect(this.mobileFilterButton).toBeVisible({ timeout: 5000 });
  }

  async assertApplyButtonVisible(): Promise<void> {
    await expect(this.applyFiltersButton).toBeVisible({ timeout: 5000 });
  }

  async assertClearDrawerButtonVisible(): Promise<void> {
    await expect(this.clearFiltersInDrawerButton).toBeVisible({ timeout: 5000 });
  }

  async assertFilterSectionHidden(type: 'color' | 'size' | 'sort'): Promise<void> {
    await expect(this.filterSectionByType(type)).not.toBeVisible({ timeout: 5000 });
  }
}
