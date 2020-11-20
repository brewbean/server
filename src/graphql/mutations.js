export const INSERT_BARISTA = `
  mutation ($object: barista_insert_input!) {
    insert_barista_one(object: $object) {
      id
      email
      display_name
      created_on
    }
  }
`;

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
      }
    }
  }
`;

// delete current refresh token and generate a new, and insert the
// new refresh_token in the database
// two mutations as transaction
export const REPLACE_REFRESH_TOKEN = `
  mutation ($oldRefreshToken: uuid!, $newRefreshTokenObject: refresh_token_insert_input!, $baristaId: Int!) {
    delete_refresh_token(where: {_and: [{token: {_eq: $oldRefreshToken}}, {barista_id: {_eq: $baristaId}}]}) {
      affected_rows
    }
    insert_refresh_token_one(object: $newRefreshTokenObject) {
      id
    }
  }
`;

export const DELETE_ALL_REFRESH_TOKENS = `
  mutation delete_all_token($email: String!) {
    delete_refresh_token(where: {barista: {email: {_eq: $email}}}) {
      affected_rows
    }G
  }
`;