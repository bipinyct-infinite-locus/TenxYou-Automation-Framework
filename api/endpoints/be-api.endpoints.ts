/**
 * BE REST API endpoint constants — mirrors BE_ENDPOINTS from the frontend codebase.
 * Base URL: https://api.tenxyou.infinitelocus.com (staging)
 *
 * All paths are relative; prefix with ENV.beApiURL when constructing full URLs.
 */
export const BE = {
  // ── Search (Wizzy) ──────────────────────────────────────────────────────────
  SEARCH_SUGGESTION:   '/saleor/wizzy-suggestion',
  WIZZY_SEARCH:        '/saleor/wizzy-search',
  WIZZY_FILTER:        '/saleor/wizzy-filtered',

  // ── Wizzy Analytics Events ──────────────────────────────────────────────────
  WIZZY_EVENT_VIEW:      '/saleor/wizzy-event/view',
  WIZZY_EVENT_CLICK:     '/saleor/wizzy-event/click',
  WIZZY_EVENT_CONVERTED: '/saleor/wizzy-event/converted',

  // ── User ────────────────────────────────────────────────────────────────────
  EDIT_USER:            '/saleor/edit-user',
  GET_USER_DETAILS:     (userId: string) => `/saleor/get-user-details/${userId}`,
  GET_USER_TOKEN:       '/saleor/login/',
  NOTIFY_ME:            '/saleor/notify-me',

  // ── Fit Finder / Brand Sizes ────────────────────────────────────────────────
  GET_BRANDS:           (searchTerm: string) => `/brand-sizes/brands/search?searchTerm=${encodeURIComponent(searchTerm)}`,
  GET_BRAND_SIZE:       (brand: string, country: string) => `/brand-sizes/brands/group-by-country?brand=${encodeURIComponent(brand)}&country=${encodeURIComponent(country)}`,
  GET_TXY_SIZE:         (country: string, size_in_cm: string, category: string) =>
    `/brand-sizes/sizes/match?country_code=${encodeURIComponent(country)}&size_in_cm=${encodeURIComponent(size_in_cm)}&category=${encodeURIComponent(category)}`,
  GET_TXY_SHOE_SIZE:    '/saleor/get-tenxyou-fit-shoes',
  UPDATE_SHOE_FIT:      '/saleor/update-shoe-fit-metadata',

  // ── Navbar & Content ────────────────────────────────────────────────────────
  NAVBAR:               '/saleor/navbar-data',
  TAGBOX_POSTS:         (galleryId: string, feedIds: string[], postIds: string[]) =>
    `/saleor/tagbox-data?galleryId=${galleryId}&feedId=[${feedIds.join(',')}]&postId=[${postIds.join(',')}]`,
  DYNAMIC_PAGE:         (slug: string) => `/saleor/dynamic-pages/${encodeURIComponent(slug)}`,
  TESTIMONIALS:         '/saleor/get-testimonials',

  // ── Products ────────────────────────────────────────────────────────────────
  FILTERED_PRODUCTS:    '/saleor/filtered-products',
  PRODUCTS_BY_VARIANT:  '/saleor/products-by-variant-ids',

  // ── Checkout / Cart ─────────────────────────────────────────────────────────
  GET_OFFERS:           '/saleor/get-offers',
  HANDLE_FREEBIE:       '/cart/handle-freebie',
  UPDATE_SPECIAL_DISCOUNT: '/saleor/update-special-discount',
  CART_SYNC:            '/cart/sync',
  GET_CART:             (id: string) => `/cart/${id}`,

  // ── Orders ──────────────────────────────────────────────────────────────────
  GET_ORDERS_BY_FILTER: '/saleor/get-orders-by-filter',
  GET_ORDER_BY_NUMBER:  (orderNumber: string) => `/saleor/get-order-details/?orderNumber=${orderNumber}`,
  GET_ORDER_DETAIL:     (orderId: string) => `/saleor/order-detail?orderId=${orderId}`,
  GET_ORDER_TRACKER:    (orderId: string, fulfillmentId: string) => `/saleor/${orderId}/get-order?fulfillmentId=${fulfillmentId}`,
  GET_SHIPMENT_DETAIL:  (fulfillmentId: string, orderId: string) => `/saleor/shipmentDetails?fulfillmentId=${fulfillmentId}&orderId=${orderId}`,
  GET_YOU_MAY_LIKE:     (orderNumber: string) => `/saleor/get-you-may-like/?orderNumber=${orderNumber}`,

  // ── Returns & Exchanges ─────────────────────────────────────────────────────
  RETURN_REASONS:          '/saleor/return-reasons',
  RETURN_FULFILLMENT:      '/saleor/return-fulfillment',
  CREATE_EXCHANGE_REQUEST: '/saleor/create-exchange-request',

  // ── Ratings & Reviews ───────────────────────────────────────────────────────
  GET_RATING_QUESTIONS: (ratingCategory: string, subCategory: string, userId: string, fulfillmentId: string, variantId: string) =>
    `/saleor/get-rating-questions?rating_category=${ratingCategory}&sub_category=${subCategory}&user_id=${userId}&fulfillment_id=${fulfillmentId}&variant_id=${variantId}`,
  UPDATE_RATING_INFO:   '/saleor/update-rating-info',
  GET_ORDERS_RATING:    '/saleor/get-orders-rating',

  // ── EDD (Estimated Delivery Date) ───────────────────────────────────────────
  EDD:                  '/erp/edd',
} as const;
