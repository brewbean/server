import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import boom from '@hapi/boom';
import graphql from 'graphql';
const { print } = graphql;

import { GET_BARISTA_CRED_BY_EMAIL } from '../graphql/queries.js';

const { GRAPHQL_URL, JWT_SECRET, JWT_TOKEN_EXPIRES, HASURA_ADMIN_SECRET } = process.env;

const HASURA_ADMIN_HEADERS = {
  headers: {
    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
  }
};

export const validateCredentials = async (email, password) => {
  let barista;
  let valid;

  const body = {
    query: print(GET_BARISTA_CRED_BY_EMAIL),
    variables: { email }
  }

  const { data } = await axios.post(GRAPHQL_URL, body, HASURA_ADMIN_HEADERS);
  barista = data.data.barista[0];

  // graphql query will not error if no valid user -> empty array
  if (!barista) {
    return { valid: false, error: boom.unauthorized("Invalid 'username' or 'password'") };
  }

  valid = await bcrypt.compare(password, barista.password);
  return valid
    ? { valid, barista }
    : { valid, error: boom.unauthorized("Invalid 'username' or 'password'") }

}

export const generateJWT = ({ id, email, is_verified }) => {
  const tokenContent = {
    sub: '' + id,
    email,
    iss: "https://brewbean-api.herokuapp.com",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["barista", "guest", "unverified"],
      "x-hasura-default-role": is_verified ? "barista" : "unverified",
      "x-hasura-barista-id": '' + id
    }
  };

  return jwt.sign(tokenContent, JWT_SECRET, { expiresIn: `${JWT_TOKEN_EXPIRES}m` });
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

export const getDuplicateError = errors => {
  const { message } = errors[0]; // should only have one constraint error at a time
  if (message.includes('barista_email_key')) {
    return boom.badRequest('Email already exists');
  }
  if (message.includes('barista_display_name_key')) {
    return boom.badRequest('Display name already exists');
  }
}