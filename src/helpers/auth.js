import axios from 'axios'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import boom from '@hapi/boom'

const { GRAPHQL_URL, JWT_SECRET, JWT_TOKEN_EXPIRES, HASURA_ADMIN_SECRET } = process.env;

export const validateCredentials = async (email, password) => {
  let barista;
  let valid;

  const body = {
    query: `
      query($email: String) {
        barista(where: {email: {_eq: $email}}) {
          id
          email
          password
        }
      }
      `,
    variables: { email }
  }

  try {
    let { data } = await axios.post(GRAPHQL_URL, body, {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      }
    });

    barista = data.data.barista[0];
  } catch (e) {
    console.error(e)
    return { valid: false, error: boom.unauthorized("Unable to find 'user'") }
  }

  if (!barista) {
    return { found: false, error: boom.unauthorized("Unable to find 'user'") };
  }

  try {
    valid = await bcrypt.compare(password, barista.password);
    return valid
      ? { valid, barista }
      : { valid, error: boom.unauthorized("Invalid 'username' or 'password'") }
  } catch (e) {
    console.error(e)
    return { valid: false, error: boom.unauthorized("Invalid 'username' or 'password'") }
  }
}

export const generateJWT = ({ id, email }) => {
  const tokenContent = {
    sub: '' + id,
    email,
    iat: Date.now() / 1000,
    iss: "https://brewbean-api.herokuapp.com",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["barista"],
      "x-hasura-default-role": "barista",
      "x-hasura-barista-id": '' + id
    }
  };

  return jwt.sign(tokenContent, JWT_SECRET, { expiresIn: `${JWT_TOKEN_EXPIRES}m` })
}

export const generateGuestJWT = () => {
  const tokenContent = {
      // sub: 'guest' // is sub required?
      iat: Date.now() / 1000,
      iss: "https://brewbean-api.herokuapp.com",
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": ["guest"],
        "x-hasura-default-role": "guest"
      }
  };

  return jwt.sign(tokenContent, JWT_SECRET)
}