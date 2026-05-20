// Saleor Admin GraphQL mutations for voucher lifecycle management

export const TOKEN_REFRESH = `
  mutation TokenRefresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      errors {
        field
        message
      }
    }
  }
`;

export const TOKEN_AUTH = `
  mutation TokenAuth($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      errors {
        field
        message
      }
    }
  }
`;

export const VOUCHER_CREATE = `
  mutation VoucherCreate($input: VoucherInput!) {
    voucherCreate(input: $input) {
      voucher {
        id
        code
        name
        type
        discountValueType
        applyOncePerOrder
        applyOncePerCustomer
        startDate
        endDate
        usageLimit
        channelListings {
          id
          channel {
            id
            slug
            name
          }
          discountValue
          currency
          minSpent {
            amount
            currency
          }
          minCheckoutItemsQuantity
        }
      }
      errors {
        field
        message
        code
        channels
        voucherCodes
      }
    }
  }
`;

export const VOUCHER_DELETE = `
  mutation VoucherDelete($id: ID!) {
    voucherDelete(id: $id) {
      voucher {
        id
        code
      }
      errors {
        field
        message
      }
    }
  }
`;

export const VOUCHER_UPDATE = `
  mutation VoucherUpdate($id: ID!, $input: VoucherInput!) {
    voucherUpdate(id: $id, input: $input) {
      voucher {
        id
        code
        name
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const VOUCHER_CHANNEL_LISTING_UPDATE = `
  mutation VoucherChannelListingUpdate($id: ID!, $input: VoucherChannelListingUpdateInput!) {
    voucherChannelListingUpdate(id: $id, input: $input) {
      voucher {
        id
        code
        channelListings {
          id
          channel { id slug }
          discountValue
          currency
          minSpent { amount currency }
          minCheckoutItemsQuantity
        }
      }
      errors {
        field
        message
        code
        channels
      }
    }
  }
`;

export const VOUCHER_CATALOGUES_ADD = `
  mutation VoucherCataloguesAdd($id: ID!, $input: CatalogueInput!) {
    voucherCataloguesAdd(id: $id, input: $input) {
      voucher {
        id
        code
        type
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const VOUCHER_CATALOGUES_REMOVE = `
  mutation VoucherCataloguesRemove($id: ID!, $input: CatalogueInput!) {
    voucherCataloguesRemove(id: $id, input: $input) {
      voucher {
        id
        code
      }
      errors {
        field
        message
      }
    }
  }
`;
