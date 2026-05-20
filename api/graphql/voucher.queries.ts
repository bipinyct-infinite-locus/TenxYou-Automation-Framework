// Saleor Admin GraphQL queries for channel/product/variant lookups

export const GET_CHANNELS = `
  query GetChannels {
    channels {
      id
      name
      slug
      currencyCode
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: String!, $channel: String!) {
    product(slug: $slug, channel: $channel) {
      id
      name
      slug
      metadata {
        key
        value
      }
      variants {
        id
        name
        sku
        metadata {
          key
          value
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = `
  query GetProductById($id: ID!, $channel: String!) {
    product(id: $id, channel: $channel) {
      id
      name
      slug
      metadata {
        key
        value
      }
      variants {
        id
        name
        sku
        metadata {
          key
          value
        }
      }
    }
  }
`;

export const GET_VOUCHER = `
  query GetVoucher($id: ID!) {
    voucher(id: $id) {
      id
      code
      name
      type
      discountValueType
      applyOncePerOrder
      startDate
      endDate
      metadata {
        key
        value
      }
      channelListings {
        id
        channel { id slug }
        discountValue
        currency
        minSpent { amount currency }
        minCheckoutItemsQuantity
      }
    }
  }
`;

export const GET_VOUCHER_BY_CODE = `
  query GetVoucherByCode($filter: VoucherFilterInput) {
    vouchers(filter: $filter, first: 1) {
      edges {
        node {
          id
          code
          name
          type
          discountValueType
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;
