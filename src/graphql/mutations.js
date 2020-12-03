import gql from 'graphql-tag';

export const INSERT_BARISTA = gql`
  mutation ($object: barista_insert_input!) {
    insert_barista_one(object: $object) {
      id
      email
      verified
      refetch_tokens {
        token
        expires_at
        barista_id
      }
    }
  }
`;

// barista data sent with login comes from here
export const INSERT_REFRESH_TOKEN = gql`
  mutation ($object: refresh_token_insert_input!) {
    insert_refresh_token_one(object: $object) {
      token
      expires_at
      created_at
    }
  }
`;

export const REPLACE_REFRESH_TOKEN = gql`
  mutation ($oldRefreshToken: uuid!, $newRefreshTokenObject: refresh_token_set_input) {
    update_refresh_token_by_pk(pk_columns: {token: $oldRefreshToken}, _set: $newRefreshTokenObject) {
      token
      expires_at
      created_at
      barista {
        id
        email
        verified
      }
    }
  }
`;

export const DELETE_ALL_REFRESH_TOKENS = gql`
  mutation ($email: String!) {
    delete_refresh_token(where: {barista: {email: {_eq: $email}}}) {
      affected_rows
    }
  }
`;

export const DELETE_REFRESH_TOKEN = gql`
  mutation ($refreshToken: uuid!) {
    delete_refresh_token_by_pk(token: $refreshToken) {
      token
      created_at
      barista_id
    }
  }
`;