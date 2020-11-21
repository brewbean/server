export const INSERT_BARISTA = `
  mutation ($object: barista_insert_input!) {
    insert_barista_one(object: $object) {
      id
      email
      display_name
      avatar
      verified
      created_on
      refetch_tokens {
        token
        id
        expires_at
        barista_id
      }
    }
  }
`;

// barista data sent with login comes from here
export const INSERT_REFRESH_TOKEN = `
  mutation ($object: refresh_token_insert_input!) {
    insert_refresh_token_one(object: $object) {
      id
      token
      expires_at
      created_at
      barista {
        id
        email
        display_name
        avatar
        verified
      }
    }
  }
`;

// delete current refresh token and generate a new, and insert the
// new refresh_token in the database
// two mutations as transaction
export const REPLACE_REFRESH_TOKEN = `
  mutation ($oldRefreshToken: uuid!, $newRefreshTokenObject: refresh_token_insert_input!) {
    delete_refresh_token(where: {token: {_eq: $oldRefreshToken}}) {
      affected_rows
    }
    insert_refresh_token_one(object: $newRefreshTokenObject) {
      id
    }
  }
`;

export const DELETE_ALL_REFRESH_TOKENS = `
  mutation ($email: String!) {
    delete_refresh_token(where: {barista: {email: {_eq: $email}}}) {
      affected_rows
    }
  }
`;

export const DELETE_REFRESH_TOKEN = `
  mutation ($refreshToken:uuid!) {
    delete_refresh_token(where: {token: {_eq: $refreshToken}}) {
      affected_rows
    }
  }
`;