import bcrypt from 'bcrypt'
import axios from 'axios'
import joi from 'joi'
import jwt from 'jsonwebtoken'
import boom from '@hapi/boom'
import { v4 as uuidv4 } from 'uuid';
import { validateCredentials, generateJWT, generateGuestJWT, getDuplicateError } from '../helpers/auth.js';
import { DELETE_ALL_REFRESH_TOKENS, DELETE_REFRESH_TOKEN, INSERT_BARISTA, INSERT_REFRESH_TOKEN, REPLACE_REFRESH_TOKEN } from '../graphql/mutations.js';
import { GET_REFRESH_TOKEN_BY_ID } from '../graphql/queries.js';

const { GRAPHQL_URL, HASURA_ADMIN_SECRET, JWT_SECRET, JWT_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES } = process.env;

const HASURA_ADMIN_HEADERS = {
  headers: {
    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
  }
};

export const signupController = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required(),
    password: joi.string().required(),
    displayName: joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, password, displayName } = value;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const refreshToken = uuidv4();

    const body = {
      query: INSERT_BARISTA,
      variables: {
        object: {
          email,
          display_name: displayName,
          password: passwordHash,
          refetch_tokens: {
            data: [
              {
                token: refreshToken,
                expires_at: new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000)),
              }
            ]
          }
        }
      }
    }

    const { data } = await axios.post(GRAPHQL_URL, body, HASURA_ADMIN_HEADERS);

    if (data.errors) {
      const duplicateErrors = data.errors.filter(({ extensions: { code } }) => code === 'constraint-violation');
      const isDuplicateError = duplicateErrors.length > 0;
      if (isDuplicateError) {
        return next(getDuplicateError(duplicateErrors));
      }
    }

    const barista = data.data.insert_barista_one;
    const token = generateJWT(barista); // create token + barista data
    const tokenExpiry = new Date(new Date().getTime() + (JWT_TOKEN_EXPIRES * 60 * 1000));

    res.cookie('refreshToken', refreshToken, {
      maxAge: REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
      httpOnly: true,
      secure: false
    });
    res.json({
      token,
      tokenExpiry,
      refreshToken,
      id: barista.id,
      email: barista.email,
      displayName: barista.display_name,
      avatar: barista.avatar,
      verified: barista.verified,
    });
  } catch (e) {
    return next(boom.badImplementation('Unable to create user.'));
  }
};

export const loginController = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required(),
    password: joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, password } = value;

  try {
    const { error: credentialError, valid, barista } = await validateCredentials(email, password);

    if (!valid) {
      return next(credentialError)
    }

    const token = generateJWT(barista);
    const tokenExpiry = new Date(new Date().getTime() + (JWT_TOKEN_EXPIRES * 60 * 1000));
    const refreshToken = uuidv4();

    const body = {
      query: INSERT_REFRESH_TOKEN,
      variables: {
        object: {
          barista_id: barista.id,
          token: refreshToken,
          expires_at: new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000)), // convert from minute to milliseconds
        }
      }
    }

    const { data } = await axios.post(GRAPHQL_URL, body, HASURA_ADMIN_HEADERS);

    const user = data.data.insert_refresh_token_one.barista;

    res.cookie('refreshToken', refreshToken, {
      maxAge: REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
      httpOnly: true,
      secure: false
    });

    res.json({
      token,
      tokenExpiry,
      refreshToken,
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar,
      verified: user.verified,
    });
  } catch (e) {
    return next(boom.badImplementation("Could not update 'refresh token' for user"));
  }
};

export const refreshTokenController = async (req, res, next) => {
  const refreshToken = req.cookies['refreshToken'];
  console.log("R_TOKEN ->", refreshToken);

  if (refreshToken === null || refreshToken === undefined) {
    return next(boom.unauthorized("Invalid refresh token request"));
  }

  try {
    const { data } = await axios.post(GRAPHQL_URL,
      {
        query: GET_REFRESH_TOKEN_BY_ID,
        variables: { refreshToken }
      },
      HASURA_ADMIN_HEADERS
    );

    const hasuraTokens = data.data.refresh_token;

    if (hasuraTokens.length === 0) {
      return next(boom.unauthorized("invalid refresh token"));
    }

    const { barista } = hasuraTokens[0];
    const newRefreshToken = uuidv4();

    const body = {
      query: REPLACE_REFRESH_TOKEN,
      variables: {
        oldRefreshToken: refreshToken,
        newRefreshTokenObject: {
          barista_id: barista.id,
          token: newRefreshToken,
          expires_at: new Date(new Date().getTime() + (REFRESH_TOKEN_EXPIRES * 60 * 1000)), // convert from minute to milliseconds
        },
      }
    }
    await axios.post(GRAPHQL_URL, body, HASURA_ADMIN_HEADERS);

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
      id: barista.id,
      email: barista.email,
      displayName: barista.display_name,
      avatar: barista.avatar,
      verified: barista.verified,
    });

  } catch (e) {
    return next(boom.unauthorized("Invalid 'refreshToken' or 'baristaId'"));
  }
}

// should delete refresh token
export const logoutController = async (req, res, next) => {
  const refreshToken = req.cookies['refreshToken'];

  if (refreshToken === null || refreshToken === undefined) {
    res.cookie('refresh_token', "", {
      httpOnly: true,
      expires: new Date(0)
    });
    res.send('OK');
  }
  try {
    await axios.post(GRAPHQL_URL,
      {
        query: DELETE_REFRESH_TOKEN,
        variables: { refreshToken },
      },
      HASURA_ADMIN_HEADERS
    );

    res.cookie('refresh_token', "", {
      httpOnly: true,
      expires: new Date(0)
    });
    res.send('OK');
  } catch (e) {
    return next(boom.badRequest("Error logging out"));
  }
}

export const logoutAllController = async (req, res, next) => {
  const authHeader = req.header('authorization')

  if (!authHeader) return next(boom.unauthorized("No token provided"));

  const token = authHeader.split(' ')[1];

  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.email !== value.email) {
      return next(boom.unauthorized('You do not have permissions'))
    }
  } catch (e) {
    return next(boom.unauthorized('Bad token'))
  }

  const body = {
    query: DELETE_ALL_REFRESH_TOKENS,
    variables: {
      email: value.email
    }
  }

  try {
    await axios.post(GRAPHQL_URL, body, HASURA_ADMIN_HEADERS);
  } catch (e) {
    return next(boom.badRequest("Error calling request"));
  }

  // will send OK even if an invalid email sent (DESIRED? @James @William)
  res.send('OK');
};

export const guestController = async (req, res, next) => {
  const token = generateGuestJWT();
  res.json({
    token
  });
};