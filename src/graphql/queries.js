export const GET_REFRESH_TOKEN_BY_ID = `
  query ($refreshToken: uuid!) {
    refresh_token(where: {token: {_eq: $refreshToken}}) {
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

// used just for verifying password
export const GET_BARISTA_BY_EMAIL = `
  query($email: String) {
    barista(where: {email: {_eq: $email}}) {
      id
      email
      password
    }
  }
`;