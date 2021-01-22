import { sgMail } from "../config.js";

const {
  SENDGRID_VERIFIED_SENDER,
  SENDGRID_CONFIRMATION_TEMPLATE_ID,
  BASE_URL,
} = process.env;

export function sendConfirmation(email, verificationCode) {
  const msg = {
    to: email,
    from: SENDGRID_VERIFIED_SENDER,
    template_id: SENDGRID_CONFIRMATION_TEMPLATE_ID,
    dynamic_template_data: {
      subject: "Welcome to brewbean.",
      preheader: "Activate your brewbean account",
      verifyUrl: `${BASE_URL}/activate?code=${verificationCode}&email=${email}`,
    },
    hideWarnings: true, // hide warnings about dynamic templates
  };
  return sgMail.send(msg);
}
