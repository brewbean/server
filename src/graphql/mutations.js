import gql from "graphql-tag";

export const INSERT_BARISTA = gql`
  mutation($object: verification_code_insert_input!) {
    insert_verification_code_one(object: $object) {
      code
      expires_at
      barista {
        id
        email
        is_verified
        refresh_tokens {
          token
          expires_at
          barista_id
        }
      }
    }
  }
`;

// barista data sent with login comes from here
export const INSERT_REFRESH_TOKEN = gql`
  mutation($object: refresh_token_insert_input!) {
    insert_refresh_token_one(object: $object) {
      token
      expires_at
      created_at
    }
  }
`;

export const DELETE_ALL_REFRESH_TOKENS = gql`
  mutation($email: String!) {
    delete_refresh_token(where: { barista: { email: { _eq: $email } } }) {
      affected_rows
    }
  }
`;

export const DELETE_REFRESH_TOKEN = gql`
  mutation($refreshToken: uuid!) {
    delete_refresh_token_by_pk(token: $refreshToken) {
      token
      created_at
      barista_id
    }
  }
`;

export const VERIFY_BARISTA = gql`
  mutation($barista_id: Int!) {
    update_barista_by_pk(
      pk_columns: { id: $barista_id }
      _set: { is_verified: true }
    ) {
      id
    }
    delete_verification_code(where: { barista_id: { _eq: $barista_id } }) {
      affected_rows
    }
  }
`;

export const REPLACE_VERIFICATION_CODE = gql`
  mutation($barista_id: Int!, $expires_at: timestamptz!) {
    delete_verification_code(where: { barista_id: { _eq: $barista_id } }) {
      affected_rows
    }
    insert_verification_code_one(
      object: { expires_at: $expires_at, barista_id: $barista_id }
    ) {
      barista_id
      code
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation($id: Int!, $input: barista_set_input, $token: uuid!) {
    update_barista_by_pk(pk_columns: { id: $id }, _set: $input) {
      id
      password
    }
    delete_refresh_token(
      where: { _and: { barista_id: { _eq: $id }, token: { _neq: $token } } }
    ) {
      affected_rows
    }
  }
`;
