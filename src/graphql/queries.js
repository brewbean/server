import gql from 'graphql-tag';

export const fragments = {
  barista: gql`
    fragment BaristaDetails on barista {
      id
      email
      display_name
      avatar
      verified
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
    }
  }
`;