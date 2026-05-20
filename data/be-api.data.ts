/**
 * Test payloads for all BE REST API endpoints.
 * Values mirror real request shapes traced from the frontend codebase.
 */



// ── Search (Wizzy) ────────────────────────────────────────────────────────────

const SESSION_ID = 'auto_sess_test_001';
const TIMESTAMP  = () => Date.now();

export const SEARCH = {
  suggestion: {
    valid: {
      q: 'running shoe',
      sessionId: SESSION_ID,
      sessionIdentifier: SESSION_ID,
      timestamp: TIMESTAMP(),
      suggestionsCount: 5,
      productsCount: 5,
      getAllVariants: 'false',
    },
    emptyQuery: {
      q: '',
      sessionId: SESSION_ID,
      sessionIdentifier: SESSION_ID,
      timestamp: TIMESTAMP(),
      suggestionsCount: 5,
      productsCount: 5,
      getAllVariants: 'false',
    },
  },

  wizzySearch: {
    valid: {
      q: 'running shoe',
      page: 1,
      pageSize: 24,
      productsCount: 24,
      minQueryLength: 3,
      includeOutOfStock: false,
      getAllVariants: true,
      attributeFacetValuesLimit: 100,
      facets: JSON.stringify([
        { key: 'colors' },
        { key: 'sizes' },
        { key: 'price' },
        { key: 'brands' },
        { key: 'categories' },
      ]),
      ignoreEmptyFacets: false,
      sessionId: SESSION_ID,
      sessionIdentifier: SESSION_ID,
      timestamp: TIMESTAMP(),
    },
    page2: {
      q: 'running shoe',
      page: 2,
      pageSize: 24,
      productsCount: 24,
      minQueryLength: 3,
      includeOutOfStock: false,
      getAllVariants: true,
      attributeFacetValuesLimit: 100,
      facets: JSON.stringify([{ key: 'colors' }, { key: 'sizes' }, { key: 'price' }]),
      ignoreEmptyFacets: false,
      sessionId: SESSION_ID,
      sessionIdentifier: SESSION_ID,
      timestamp: TIMESTAMP(),
    },
    withSort: {
      q: 'shoe',
      page: 1,
      pageSize: 24,
      productsCount: 24,
      minQueryLength: 3,
      includeOutOfStock: false,
      getAllVariants: true,
      attributeFacetValuesLimit: 100,
      facets: JSON.stringify([{ key: 'colors' }, { key: 'sizes' }, { key: 'price' }]),
      ignoreEmptyFacets: false,
      sessionId: SESSION_ID,
      sessionIdentifier: SESSION_ID,
      timestamp: TIMESTAMP(),
      sort: 'price_asc',
    },
  },

  wizzyFilter: {
    valid: {
      q: 'running shoe',
      searchedKey: 'running shoe',
      page: 1,
      productsCount: 24,
      filters: { colors: ['Black'] },
    },
    multiFilter: {
      q: 'shoe',
      searchedKey: 'shoe',
      page: 1,
      productsCount: 24,
      filters: { colors: ['Black', 'White'], sizes: ['UK 8'] },
    },
    noSearchedKey: {
      q: 'shoe',
      searchedKey: '',
      page: 1,
      productsCount: 24,
      filters: { colors: ['Black'] },
    },
  },

  wizzyEvents: {
    view: {
      name: 'search_start',
      searchResponseId: null,
      items: [],
      triggeredOn: new Date().toISOString(),
      source: 'SEARCH_RESULTS',
      q: 'running shoe',
      sessionIdentifier: SESSION_ID,
    },
    click: {
      name: 'search_product_click',
      searchResponseId: 'resp_test_001',
      items: [{ itemId: 'UHJvZHVjdFZhcmlhbnQ6MTIz', position: 1 }],
      triggeredOn: new Date().toISOString(),
      source: 'SEARCH_RESULTS',
      q: 'running shoe',
      sessionIdentifier: SESSION_ID,
    },
    converted: {
      name: 'atc_search',
      items: [{ itemId: 'UHJvZHVjdFZhcmlhbnQ6MTIz' }],
      triggeredOn: new Date().toISOString(),
      value: 1999,
      qty: 1,
      q: 'running shoe',
      searchResponseId: 'resp_test_001',
      sessionIdentifier: SESSION_ID,
      source: 'SEARCH_RESULTS',
    },
  },
};

// ── Navbar ────────────────────────────────────────────────────────────────────

// GET — no payload needed

// ── Orders ────────────────────────────────────────────────────────────────────

export const ORDERS = {
  filterAll: {
    filter: {},
    first: 10,
    after: null,
  },
  filterFulfilled: {
    filter: { status: 'FULFILLED' },
    first: 5,
    after: null,
  },
  filterCancelled: {
    filter: { status: 'CANCELLED' },
    first: 5,
    after: null,
  },
  missingFilter: {
    first: 10,
  },
  // These should be substituted with real IDs from a test order fixture
  sampleOrderId:     process.env.TEST_ORDER_ID || 'T3JkZXI6MTIz',
  sampleOrderNumber: process.env.TEST_ORDER_NUMBER || 'ORD-001',
  sampleFulfillmentId: process.env.TEST_FULFILLMENT_ID || 'RnVsZmlsbG1lbnQ6MTIz',
};

// ── Returns & Exchanges ───────────────────────────────────────────────────────

export const RETURNS = {
  validFulfillments: JSON.stringify([
    {
      fulfillmentId: process.env.TEST_FULFILLMENT_ID || 'RnVsZmlsbG1lbnQ6MTIz',
      fulfillmentLines: [
        {
          fulfillmentLineId: process.env.TEST_FULFILLMENT_LINE_ID || 'RnVsZmlsbG1lbnRMaW5lOjE=',
          quantity: 1,
          reasonAndComments: [{ reason: 'Wrong size', comment: 'Too small' }],
        },
      ],
    },
  ]),
  missingFulfillmentId: JSON.stringify([
    {
      fulfillmentLines: [
        {
          fulfillmentLineId: 'RnVsZmlsbG1lbnRMaW5lOjE=',
          quantity: 1,
          reasonAndComments: [],
        },
      ],
    },
  ]),
};

export const EXCHANGE = {
  validFulfillments: [
    {
      fulfillmentId: process.env.TEST_FULFILLMENT_ID || 'RnVsZmlsbG1lbnQ6MTIz',
      fulfillmentLines: [
        {
          fulfillmentLineId: process.env.TEST_FULFILLMENT_LINE_ID || 'RnVsZmlsbG1lbnRMaW5lOjE=',
          quantity: 1,
          newVariantId: process.env.TEST_NEW_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6NDU2',
          reasonAndComments: [{ reason: 'Wrong size', comment: 'Want UK 9' }],
        },
      ],
    },
  ],
};

// ── Cart / Checkout Helpers ───────────────────────────────────────────────────

export const CART = {
  offers: {
    valid: {
      channel: 'txy',
      cartTotal: 2999,
      checkoutId: process.env.TEST_CHECKOUT_ID || '',
    },
    zeroTotal: {
      channel: 'txy',
      cartTotal: 0,
      checkoutId: process.env.TEST_CHECKOUT_ID || '',
    },
    missingFields: {},
  },

  freebie: {
    basic: {
      checkoutId: process.env.TEST_CHECKOUT_ID || 'Q2hlY2tvdXQ6YWJj',
    },
    withRemoval: {
      checkoutId: process.env.TEST_CHECKOUT_ID || 'Q2hlY2tvdXQ6YWJj',
      was_free_gift_removed: true,
      removed_gifts_against_variant_ids: ['UHJvZHVjdFZhcmlhbnQ6MTIz'],
    },
  },

  sync: {
    valid: {
      checkoutId: process.env.TEST_CHECKOUT_ID || 'Q2hlY2tvdXQ6YWJj',
      lines: [{ variantId: 'UHJvZHVjdFZhcmlhbnQ6MTIz', quantity: 1 }],
    },
  },

  sampleCartId: process.env.TEST_CART_ID || 'Q2hlY2tvdXQ6YWJj',
};

// ── EDD ───────────────────────────────────────────────────────────────────────

export const EDD = {
  valid: {
    pincode: '400001',
    variants: [
      { variantId: process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz', quantity: 1 },
    ],
  },
  multiVariant: {
    pincode: '560001',
    variants: [
      { variantId: process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz', quantity: 1 },
      { variantId: process.env.TEST_VARIANT_ID_2 || 'UHJvZHVjdFZhcmlhbnQ6NDU2', quantity: 2 },
    ],
  },
  invalidPincode: {
    pincode: '000000',
    variants: [
      { variantId: process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz', quantity: 1 },
    ],
  },
  emptyVariants: {
    pincode: '400001',
    variants: [],
  },
};

// ── Ratings ───────────────────────────────────────────────────────────────────

export const RATINGS = {
  getQuestions: {
    valid: {
      ratingCategory: 'PRODUCT',
      subCategory: 'COMFORT',
      userId: process.env.TEST_USER_ID || 'VXNlcjoxMjM=',
      fulfillmentId: process.env.TEST_FULFILLMENT_ID || 'RnVsZmlsbG1lbnQ6MTIz',
      variantId: process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz',
    },
  },

  updateRating: {
    valid: {
      user_id:        process.env.TEST_USER_ID || 'VXNlcjoxMjM=',
      order_id:       process.env.TEST_ORDER_ID || 'T3JkZXI6MTIz',
      fulfillment_id: process.env.TEST_FULFILLMENT_ID || 'RnVsZmlsbG1lbnQ6MTIz',
      variant_id:     process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz',
      product_id:     process.env.TEST_PRODUCT_ID || 'UHJvZHVjdDoxMjM=',
      rating: 4,
      questions: [{ questionId: 'q1', answer: '5' }],
      rating_category: 'PRODUCT',
      source: 'web',
    },
    missingSource: {
      user_id:        process.env.TEST_USER_ID || 'VXNlcjoxMjM=',
      order_id:       process.env.TEST_ORDER_ID || 'T3JkZXI6MTIz',
      fulfillment_id: process.env.TEST_FULFILLMENT_ID || 'RnVsZmlsbG1lbnQ6MTIz',
      variant_id:     process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz',
      product_id:     process.env.TEST_PRODUCT_ID || 'UHJvZHVjdDoxMjM=',
      rating: 4,
      questions: [],
      rating_category: 'PRODUCT',
      // source intentionally missing
    },
  },

  getOrdersRating: {
    valid: {
      order_ids: [process.env.TEST_ORDER_ID || 'T3JkZXI6MTIz'],
    },
    empty: {
      order_ids: [],
    },
  },
};

// ── User & Fit Finder ─────────────────────────────────────────────────────────

export const USER = {
  editUser: {
    valid: {
      id: process.env.TEST_USER_ID || 'VXNlcjoxMjM=',
      firstName: 'Automation',
      lastName: 'Test',
    },
    missingId: {
      firstName: 'Automation',
      lastName: 'Test',
    },
  },

  userId: process.env.TEST_USER_ID || 'VXNlcjoxMjM=',

  fitFinder: {
    shoeSizeByLength: {
      type: 'men',
      length: 27.5,
    },
    txySize: {
      country: 'IN',
      size_in_cm: '27.5',
      category: 'men',
    },
    updateShoeFit: {
      user_id: process.env.TEST_USER_ID || 'VXNlcjoxMjM=',
      fit_finder_data: JSON.stringify({ size: 'UK 8', width: 'regular' }),
    },
  },

  notifyMe: {
    valid: {
      product_id: process.env.TEST_PRODUCT_ID || 'UHJvZHVjdDoxMjM=',
      variant_id: process.env.TEST_VARIANT_ID || 'UHJvZHVjdFZhcmlhbnQ6MTIz',
      phone: process.env.TEST_USER_PHONE || '9876543210',
      name: 'Automation Test',
      link: 'https://tenxyou.infinitelocus.com/product/test-shoe/123',
    },
    missingRequired: {
      product_id: '',
      variant_id: '',
      phone: '9876543210',
      name: 'Test',
      link: '',
    },
  },
};
