import axios from "axios";
import boom from "@hapi/boom";
import joi from "joi";
import { HASURA_ADMIN_HEADERS } from "../config.js";
import graphql from "graphql";
const { print } = graphql;

import { sendConfirmation } from "../helpers/verify.js";
import {
  GET_BARISTA_VERIFICATION_CODE,
  GET_BARISTA_IS_VERIFIED,
} from "../graphql/queries.js";
import {
  VERIFY_BARISTA,
  REPLACE_VERIFICATION_CODE,
} from "../graphql/mutations.js";

const { GRAPHQL_URL, VERIFICATION_CODE_EXPIRES } = process.env;

export const validationController = async (req, res, next) => {
  const schema = joi.object().keys({
    email: joi.string().email().lowercase().required(),
    verificationCode: joi.string().guid().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(boom.badRequest(error.details[0].message));
  }

  const { email, verificationCode } = value;

  try {
    const { data } = await axios.post(
      GRAPHQL_URL,
      {
        query: print(GET_BARISTA_VERIFICATION_CODE),
        variables: { email },
      },
      HASURA_ADMIN_HEADERS
    );

    const barista = data.data.barista[0];

    if (!barista) return next(boom.unauthorized("Invalid email"));

    if (barista.is_verified)
      return next(boom.resourceGone("barista already verified"));

    const { code, expires_at } = barista.verification_code;

    if (verificationCode === code && new Date(expires_at) > new Date()) {
      await axios.post(
        GRAPHQL_URL,
        {
          query: print(VERIFY_BARISTA),
          variables: { barista_id: barista.id },
        },
        HASURA_ADMIN_HEADERS
      );

      res.send("OK");
    } else {
      return next(boom.resourceGone("Verification code expired or invalid"));
    }
  } catch (e) {
    return next(boom.badRequest("Error validating email"));
  }
};

export const resendController = async (req, res, next) => {
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

    if (!barista) return next(boom.unauthorized("Invalid email"));

    if (barista.is_verified)
      return next(boom.resourceGone("barista already verified"));

    const verificationCodeExpiry = new Date(
      new Date().getTime() + VERIFICATION_CODE_EXPIRES * 60 * 1000
    ).toISOString();

    const { data: verifyData } = await axios.post(
      GRAPHQL_URL,
      {
        query: print(REPLACE_VERIFICATION_CODE),
        variables: {
          barista_id: barista.id,
          expires_at: verificationCodeExpiry,
        },
      },
      HASURA_ADMIN_HEADERS
    );
    
    const { code } = verifyData.data.insert_verification_code_one;
    await sendConfirmation(email, code);

    res.send("OK");
  } catch (e) {
    return next(boom.badRequest("Error validating email"));
  }
};
