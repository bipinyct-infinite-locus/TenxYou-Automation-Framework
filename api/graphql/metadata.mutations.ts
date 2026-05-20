// Saleor Admin GraphQL mutations for metadata management on any object

export const UPDATE_METADATA = `
  mutation UpdateMetadata($id: ID!, $input: [MetadataInput!]!) {
    updateMetadata(id: $id, input: $input) {
      errors {
        field
        message
        code
      }
      item {
        metadata {
          key
          value
        }
      }
    }
  }
`;

export const DELETE_METADATA = `
  mutation DeleteMetadata($id: ID!, $keys: [String!]!) {
    deleteMetadata(id: $id, keys: $keys) {
      errors {
        field
        message
        code
      }
      item {
        metadata {
          key
          value
        }
      }
    }
  }
`;

export const UPDATE_PRIVATE_METADATA = `
  mutation UpdatePrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      errors {
        field
        message
        code
      }
      item {
        privateMetadata {
          key
          value
        }
      }
    }
  }
`;

export const DELETE_PRIVATE_METADATA = `
  mutation DeletePrivateMetadata($id: ID!, $keys: [String!]!) {
    deletePrivateMetadata(id: $id, keys: $keys) {
      errors {
        field
        message
        code
      }
      item {
        privateMetadata {
          key
          value
        }
      }
    }
  }
`;
