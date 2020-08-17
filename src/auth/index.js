import express from 'express';
import bcrypt from 'bcrypt'
import axios from 'axios'
import joi from 'joi'
import boom from '@hapi/boom'
import { v4 as uuidv4 } from 'uuid';
import { validateCredentials, generateJWT } from '../helpers/auth.js';

const { GRAPHQL_URL, HASURA_ADMIN_SECRET, JWT_TOKEN_EXPIRES } = process.env;

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  let passwordHash;

  const schema = Joi.object().keys({
    email: joi.string().required(),
    password: joi.string().required(),
    displayName: joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, password, displayName } = value;

  try {
    passwordHash = await bcrypt.hash(password, 10);
  } catch (e) {
    console.error(e);
    return next(boom.badImplementation("Unable to generate 'password hash'"));
  }

  const body = {
    query: `
      mutation ($object: barista_insert_input!) {
        insert_barista_one(object: $object) {
          id
          email
          display_name
          created_on
        }
      }
    `,
    variables: {
      object: {
        email,
        display_name: displayName,
        password: passwordHash,
      }
    }
  }

  try {
    await axios.post(GRAPHQL_URL, body, {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      }
    });
  } catch (e) {
    let isDuplicateError = e.response.errors.filter(({ extensions: { code } }) => code === 'constraint-violation').length > 0
    if (isDuplicateError) {
      return next(boom.badRequest('User already exist'));
    }
    return next(boom.badImplementation('Unable to create user.'));
  }

  res.send('OK');
});

router.post('/login', async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().required(),
    password: joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, password } = value;

  const { error, valid, barista } = await validateCredentials(email, password);

  if (!valid) {
    return next(error)
  }

  const token = generateJWT(barista);
  const tokenExpiry = new Date(new Date().getTime() + (JWT_TOKEN_EXPIRES * 60 * 1000));
  const refreshToken = uuidv4();

  const body = {
    query: `
      mutation ($object: refresh_token_insert_input!) {
        insert_refresh_token_one(object: $object) {
          id
          token
          expires_at
          created_at
          barista {
            email
          }
        }
      }
    `,
    variables: {
      object: {
        barista_id: barista.id,
        token: refreshToken,
        expires_at: new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000)), // convert from minute to milliseconds
      }
    }
  }

  try {
    await axios.post(GRAPHQL_URL, body, {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      }
    });
  } catch (e) {
    console.error(e)
    return next(boom.badImplementation("Could not update 'refresh token' for user"));
  }

  res.cookie('refreshToken', refreshToken, {
    maxAge: REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: true,
    secure: false
  });

  res.json({
    token,
    tokenExpiry,
    refreshToken,
  });
});

router.post('/refresh-token', async (req, res, next) => {
  const refreshToken = req.cookies['refreshToken'];

  const body = {
    query: `
      query ($refreshToken: uuid!) {
        refresh_token(where: {token: {_eq: $refreshToken}}) {
          barista {
            id
            email
          }
        }
      }
    `,
    variables: { refreshToken }
  }

  let hasuraTokens;

  try {
    const { data } = await axios.post(GRAPHQL_URL, body, {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      }
    });
    hasuraTokens = data.data.refresh_token;
  } catch (e) {
    console.error(e);
    return next(boom.unauthorized("Invalid refresh token request"));
  }

  if (hasuraTokens.length === 0) {
    return next(Boom.unauthorized("invalid refresh token"));
  }

  const { barista } = hasuraTokens[0];
  const newRefreshToken = uuidv4();

  // delete current refresh token and generate a new, and insert the
  // new refresh_token in the database
  // two mutations as transaction
  const replaceTokenBody = {
    query: `
      mutation ($oldRefreshToken: uuid!, $newRefreshToken: refresh_token_insert_input!, $baristaId: Int!) {
        delete_refresh_token(where: {_and: [{token: {_eq: $oldRefreshToken}}, {barista_id: {_eq: $baristaId}}]}) {
          affected_rows
        }
        insert_refresh_token_one(object: $newRefreshToken) {
          id
        }
      }
    `,
    variables: {
      baristaId: barista.id,
      oldRefreshToken: refreshToken,
      newRefreshToken,
    }
  }

  try {
    await axios.post(GRAPHQL_URL, replaceTokenBody, {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      }
    });
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized("Invalid 'refreshToken' or 'baristaId'"));
  }

  const token = generateJWT(barista);
  const tokenExpiry = new Date(new Date().getTime() + (JWT_TOKEN_EXPIRES * 60 * 1000));

  res.cookie('refreshToken', newRefreshToken, {
    maxAge: REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: true,
    secure: false
  });

  res.json({
    token,
    tokenExpiry,
    refreshToken: newRefreshToken,
    baristaId: barista.id,
  });
});


export default router;