import bcrypt from "bcrypt";
import axios from "axios";
import joi from "joi";
import boom from "@hapi/boom";
import graphql from "graphql";
const { print } = graphql;
import {
  GET_BARISTA_IS_VERIFIED,
  GET_BARISTA_PASSWORD_RESET_CODE,
} from "../graphql/queries.js";
import { sendPasswordReset } from "../helpers/email.js";
import {
  ADD_PASSWORD_REFRESH_CODE,
  CHANGE_PASSWORD,
  CHANGE_PASSWORD_BY_RESET,
} from "../graphql/mutations.js";
import { HASURA_ADMIN_HEADERS } from "../config.js";
import { validateCredentials } from "../helpers/auth.js";
const { GRAPHQL_URL, PASSWORD_RESET_CODE_EXPIRES } = process.env;

export const updatePasswordController = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required(),
    currentPassword: joi.string().required(),
    newPassword: joi.string().required(),
    refreshToken: joi.string().guid({ version: "uuidv4" }).required(),
  });

  const { error, value } = schema.validate({
    ...req.body,
    refreshToken: req.cookies["refreshToken"],
  });

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, currentPassword, newPassword, refreshToken } = value;

  if (currentPassword === newPassword) {
    return next(boom.badRequest("New password same as current password"));
  }

  try {
    const {
      error: credentialError,
      valid,
      barista,
    } = await validateCredentials(email, currentPassword);

    if (!valid) return next(credentialError);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await axios.post(
      GRAPHQL_URL,
      {
        query: print(CHANGE_PASSWORD),
        variables: {
          id: barista.id,
          input: { password: passwordHash },
          token: refreshToken,
        },
      },
      HASURA_ADMIN_HEADERS
    );
    res.send("OK");
  } catch (e) {
    return next(boom.badImplementation("Unable to change password."));
  }
};

export const forgotPasswordController = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }
  const { email } = value;

  try {
    const { data } = await axios.post(
      GRAPHQL_URL,
      {
        query: print(GET_BARISTA_IS_VERIFIED),
        variables: { email },
      },
      HASURA_ADMIN_HEADERS
    );

    const barista = data.data.barista[0];
    // If user doesn't exist, give them an obscure rejection
    // so bad actors can't use this endpoint to find user emails
    // if a user isn't verified they shouldn't be able to reset
    if (!barista || !barista.is_verified) {
      return next(boom.badRequest("User is unable to reset password"));
    }

    const passwordResetExpiry = new Date(
      new Date().getTime() + PASSWORD_RESET_CODE_EXPIRES * 60 * 1000
    ).toISOString();

    const response = await axios.post(
      GRAPHQL_URL,
      {
        query: print(ADD_PASSWORD_REFRESH_CODE),
        variables: { barista_id: barista.id, expires_at: passwordResetExpiry },
      },
      HASURA_ADMIN_HEADERS
    );

    const { code } = response.data.data.insert_password_reset_code_one;
    await sendPasswordReset(email, code);

    res.send("OK");
  } catch (e) {
    return next(boom.badRequest("Error sending password reset email"));
  }
};

export const resetPasswordController = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required(),
    code: joi.string().guid({ version: "uuidv4" }).required(),
    newPassword: joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, code, newPassword } = value;

  // change password
  try {
    const { data } = await axios.post(
      GRAPHQL_URL,
      {
        query: print(GET_BARISTA_PASSWORD_RESET_CODE),
        variables: { email },
      },
      HASURA_ADMIN_HEADERS
    );

    const barista = data.data.barista[0];

    if (!barista || barista.password_reset_code?.code !== code) {
      return next(boom.unauthorized("Incorrect email and/or code"));
    }
    const { password_reset_code } = barista;

    if (new Date() > new Date(password_reset_code.expires_at)) {
      return next(boom.unauthorized("expired reset code token"));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await axios.post(
      GRAPHQL_URL,
      {
        query: print(CHANGE_PASSWORD_BY_RESET),
        variables: {
          barista_id: barista.id,
          input: {
            password: passwordHash,
          },
        },
      },
      HASURA_ADMIN_HEADERS
    );
    
    res.send("OK");
  } catch (e) {
    return next(boom.badRequest("Error reseting password"));
  }
};
