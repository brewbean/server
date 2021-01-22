import gql from 'graphql-tag';

export const fragments = {
  barista: gql`
    fragment BaristaDetails on barista {
      id
      email
      display_name
      avatar
      is_verified
    }
  `,
}

export const GET_REFRESH_TOKEN = gql`
  query ($refreshToken: uuid!) {
    refresh_token_by_pk(token: $refreshToken) {
      barista {
        ...BaristaDetails
      }
    }
  }
  ${fragments.barista}
`;

// used just for verifying password
export const GET_BARISTA_CRED_BY_EMAIL = gql`
  query($email: String) {
    barista(where: {email: {_eq: $email}}) {
      id
      email
      password
      is_verified
    }
  }
`;

// used for email verification
export const GET_BARISTA_VERIFICATION_CODE = gql`
  query($email: String!) {
    barista(where: { email: { _eq: $email } }) {
      id
      is_verified
      verification_code {
        code
        expires_at
      }
    }
  }
`;

// used for resending email
export const GET_BARISTA_IS_VERIFIED = gql`
  query($email: String!) {
    barista(where: { email: { _eq: $email } }) {
      id
      is_verified
    }
  }
`;