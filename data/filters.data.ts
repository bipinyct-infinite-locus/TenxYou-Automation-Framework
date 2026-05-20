/**
 * Test data for the PLP Filter System.
 * Source of truth: TXY-Filters PRD (PRD-070526-143651)
 */

// ── Base Colors (10 per PRD) ──────────────────────────────────────────────────
export const BASE_COLORS = [
  { name: 'Black',  hex: '#000000' },
  { name: 'White',  hex: '#FFFFFF' },
  { name: 'Blue',   hex: '#0000FF' },
  { name: 'Red',    hex: '#FF0000' },
  { name: 'Green',  hex: '#00AA13' },
  { name: 'Gold',   hex: '#FFCC00' },
  { name: 'Orange', hex: '#FF6000' },
  { name: 'Pink',   hex: '#FFC0CB' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Brown',  hex: '#AB6A24' },
] as const;

export type BaseColorName = (typeof BASE_COLORS)[number]['name'];
export const BASE_COLOR_NAMES: BaseColorName[] = BASE_COLORS.map((c) => c.name);
export const BASE_COLOR_COUNT = BASE_COLORS.length;

// ── Color Swatch Mapping (base color → hex code) ──────────────────────────────
export const COLOR_SWATCH_MAPPING: Record<BaseColorName, string> = {
  Black:  '#000000',
  White:  '#FFFFFF',
  Blue:   '#0000FF',
  Red:    '#FF0000',
  Green:  '#00AA13',
  Gold:   '#FFCC00',
  Orange: '#FF6000',
  Pink:   '#FFC0CB',
  Purple: '#800080',
  Brown:  '#AB6A24',
};

// ── Color Filter Mapping (base color → raw product color values) ──────────────
// 91 distinct raw color names mapped from PRD ColorFilterMapping mutation
export const COLOR_FILTER_MAPPING: Record<BaseColorName, string[]> = {
  Black: [
    'Black Gray', 'Royal Black, Dark Ganache/Light Ivory', 'Royal Black, Powder Rose/Light Ivory',
    'Blackcap/Grey', 'Blackout/Gold', 'Greyscale Denim', 'Blackscale Olive', 'Bombay Blue',
    'Bright Rose', 'Carbon', 'Carbon/Flame', 'Carbon/Gold', 'Carbon/Plum', 'Chocolate Fudge',
    'Citrus Pop', 'Cloud White', 'Cool Black', 'Dark Ruby', 'Elephant skin', 'Forged Iron',
    'Gunmetal/Navy', 'Ignite Sunrise/Carbon', 'Lavender Orchid', 'Midnight Navy/Ochre',
    'Mystic Mauve', 'Night Sky', 'Ocean Dust', 'Olive Taupe', 'Outer Space', 'Pageant Blue',
    'Peony Pink', 'Plum Smoke', 'Racing Red', 'Royal Black', 'Royal Black/Racing Red', 'Royal Red',
    'Rustwood', 'Sagebrush', 'Sunshine Orange', 'Super Yellow', 'Vivid Salsa', 'Zesty Lime',
    'Dazzling Blue, Green Gables/Grey Melange',
  ],
  White: [
    'Bright White/Racing Red', 'Causeway Blue/White', 'Cloud White',
    'Royal Black, Powder Rose/Light Ivory', 'Golden Ochre/Cloud White', 'Ignite/Snowfall',
    'Light Ivory/Dazzling Blue', 'Snowfall/Lava', 'Triple White', 'Vanilla Ice', 'Vermillion/Ivory',
  ],
  Blue: [
    'Ash Blue', 'Kentucky Blue', 'Bombay Blue', 'Causeway Blue/White', 'Cobalt/Lagoon',
    'Dream Blue', 'French Blue', 'Gunmetal/Navy', 'Light Ivory/Dazzling Blue', 'Ocean Dust',
    'Pageant Blue', 'Dazzling Blue, Green Gables/Grey Melange', 'Royal Blue', 'Sealink Blue/Gold',
  ],
  Red: [
    'Bright White/Racing Red', 'Dark Ruby', 'Ignite Sunrise/Carbon', 'Ignite/Snowfall',
    'Racing Red', 'Royal Black/Racing Red', 'Royal Red', 'Royal Red/Gold', 'Vermillion/Ivory',
    'Vivid Salsa',
  ],
  Green: [
    'Concrete/Limestone', 'Graphite/Sage', 'Green Bay', 'Lime Green', 'Lime Green/Silver',
    'Olive Taupe', 'Sagebrush', 'Zesty Lime', 'Zesty Lime, Flame/Royal Black',
  ],
  Gold: [
    'Blackout/Gold', 'Carbon/Gold', 'Golden Ochre/Cloud White', 'Midnight Navy/Ochre',
    'Royal Red/Gold', 'Sealink Blue/Gold', 'Super Yellow',
  ],
  Orange: [
    'Carbon/Flame', 'Citrus Pop', 'Rustwood', 'Snowfall/Lava', 'Sunshine Orange',
    'Zesty Lime, Flame/Royal Black',
  ],
  Pink:   ['Bright Rose', 'Peony Pink', 'Royal Black, Powder Rose/Light Ivory'],
  Purple: ['Carbon/Plum', 'Lavender Orchid', 'Mystic Mauve', 'Night Purple', 'Plum Smoke'],
  Brown:  ['Cacao Drift', 'Cacao/Almond/Maple', 'Chocolate Fudge', 'Tan/Suede'],
};

// ── Size Categories (from PRD) ────────────────────────────────────────────────
export const SIZE_CATEGORIES = {
  waist:       ['28', '30', '32', '34', '36', '38', '40'],
  tshirt:      ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes:       ['6', '7', '8', '9', '10', '11'],
  accessories: ['Free Size', 'S/M', 'M/L'],
} as const;

// ── Sort Options — labels match actual button text on the site ────────────────
export const SORT_OPTIONS = {
  priceLowToHigh: { value: 'price_asc',  label: 'Price- Low to High' },
  priceHighToLow: { value: 'price_desc', label: 'Price- High to Low' },
  newest:         { value: 'newest',     label: 'Newest' },
} as const;

// ── Filter URL Query Parameters ───────────────────────────────────────────────
// URL uses a single `filters` param with JSON-encoded value, e.g.:
//   ?filters={"color":["Black"]}&sort=price_desc
export const FILTER_URL_PARAMS = {
  filters: 'filters',
  sort:    'sort',
} as const;

// ── PLPs by Backend Type — use /collection/* URLs (old slugs redirect to home) ─
export const FILTER_PLPS = {
  saleorBacked: [
    { name: 'Men Apparel',   slug: 'collection/men-apparel/183' },
    { name: 'Women Apparel', slug: 'collection/women-apparel/184' },
    { name: 'Sports Shoes',  slug: 'collection/sports-shoes/163' },
  ],
  wizzyBacked: [
    { name: 'New Launches', slug: 'collection/new-launches/233' },
    { name: 'Accessories',  slug: 'collection/x/170' },
  ],
} as const;

// ── Analytics Events (PRD §Analytics & Event Tracking) ───────────────────────
export const ANALYTICS_EVENTS = {
  filterSelected:  'filter_selected',
  filterApplied:   'filter_applied',
  filterCleared:   'filter_cleared',
  noProductsFound: 'no_products_found',
} as const;

// ── Viewport Constants ────────────────────────────────────────────────────────
export const MOBILE_VIEWPORT  = { width: 390, height: 844 };  // iPhone 14
export const DESKTOP_VIEWPORT = { width: 1600, height: 850 };
