export const PRODUCTS = {
  // ── Cricket Shoes ──────────────────────────────────────────────────────────
  cricket: [
    { slug: 'all-rounder-cricket-shoe-lime-green', name: 'All-Rounder Cricket Shoe', color: 'Lime Green' },
    { slug: 'all-rounder-cricket-shoe-bright-white', name: 'All-Rounder Cricket Shoe', color: 'Bright White' },
    { slug: 'centurion-pro-batsman-shoe-ignite', name: 'Centurion Pro Batsman Shoe', color: 'Ignite' },
    { slug: 'centurion-pro-batsman-shoe-cobalt', name: 'Centurion Pro Batsman Shoe', color: 'Cobalt' },
  ],

  // ── Running / Recovery ─────────────────────────────────────────────────────
  running: [
    { slug: 'aeonic-recovery-trainer-vermillion', name: 'Aeonic Recovery Trainer', color: 'Vermillion' },
    { slug: 'aeonic-recovery-trainer-carbon', name: 'Aeonic Recovery Trainer', color: 'Carbon' },
    { slug: 'aeonic-recovery-trainer-midnight-navy', name: 'Aeonic Recovery Trainer', color: 'Midnight Navy' },
    { slug: 'aeonic-recovery-trainer-graphite', name: 'Aeonic Recovery Trainer', color: 'Graphite' },
  ],

  // ── Lifestyle / Sneakers ───────────────────────────────────────────────────
  lifestyle: [
    { slug: 'crossover-bungee-lacing-sneaker-sage', name: 'Crossover Sneaker', color: 'Sage' },
    { slug: 'crossover-bungee-lacing-sneaker-carbon', name: 'Crossover Sneaker', color: 'Carbon' },
    { slug: 'crossover-bungee-lacing-sneaker-lilac', name: 'Crossover Sneaker', color: 'Lilac' },
    { slug: 'crossover-bungee-lacing-sneaker-storm', name: 'Crossover Sneaker', color: 'Storm' },
    { slug: 'crossover-bungee-lacing-sneaker-slate', name: 'Crossover Sneaker', color: 'Slate' },
    { slug: 'crossover-bungee-lacing-sneaker-tan', name: 'Crossover Sneaker', color: 'Tan' },
  ],

  // ── Apparel ────────────────────────────────────────────────────────────────
  apparel: [
    { slug: 'flowstate-kick-flare-pants-regular-royal-black', name: 'FlowState Kick Flare Pants', color: 'Royal Black' },
    { slug: 'flow-state-legging-mid-impact-royal-black', name: 'Flow State Legging', color: 'Royal Black' },
  ],

  // ── Accessories ────────────────────────────────────────────────────────────
  accessories: [
    { slug: 'club-cap-royal-black', name: 'Club Cap', color: 'Royal Black' },
    { slug: 'cricket-crew-socks-light-ivory', name: 'Cricket Crew Socks', color: 'Light Ivory' },
    { slug: 'footwork-pulse-cricket-insoles-royal-black', name: 'Footwork Pulse Insoles', color: 'Royal Black' },
  ],
};

export const PLP_SLUGS = {
  menGender: '/gender/men',
  womenGender: '/gender/women',
  newLaunches: '/new-launches',
  sportShoes: '/sports-shoes',
  cricket: '/sports-shoes-cricket',
  multiSport: '/sports-shoes-multi-sport',
  menApparel: '/men-apparel',
  womenApparel: '/women-apparel',
  accessories: '/accessories',
};

export const SEARCH_QUERIES = {
  valid: ['cricket shoes', 'sneakers', 'leggings', 'running shoes', 'socks'],
  partial: ['cric', 'sneak', 'legg'],
  noResults: ['xyzabc123notexist', 'zzz', 'qwerty12345'],
  special: ['!@#$%', '<script>', '   ', '0'],
  longQuery: 'a'.repeat(100),
};

export const COUPONS = {
  valid: 'FLAT200',
  invalid: 'INVALIDCODE',
  expired: 'EXPIREDCODE',
  minOrderNotMet: 'FLAT200HIGHMIN',
};

export const SIZES = {
  footwear: ['6', '7', '8', '9', '10', '11'],
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
};
