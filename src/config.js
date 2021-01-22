import sgMail from "@sendgrid/mail";
const { HASURA_ADMIN_SECRET, SENDGRID_API_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const HASURA_ADMIN_HEADERS = {
  headers: {
    "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
  },
};

export { sgMail, HASURA_ADMIN_HEADERS };
