export const GET_REFRESH_TOKEN_BY_ID = `
  query ($refreshToken: uuid!) {
    refresh_token(where: {token: {_eq: $refreshToken}}) {
      barista {
        id
        email
        display_name
        avatar
      }
    }
  }
`;