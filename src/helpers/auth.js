import axios from 'axios'
import bcrypt from 'bcrypt'

export const validateCredentials = async (email, password) => {
  try {
    const body = {
      query: `
      query($email: String) {
        barista(where: {email: {_eq: $email}}) {
          id
          email
          first_name
          last_name
          password
        }
      }
    `,
      variables: { email }
    }

    let { data } = await axios.post(process.env.GRAPHQL_URL, body, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
      }
    });
    let barista = data.data.barista[0];

    if (!barista) {
      return { valid: false, status: 404, message: "User does not exist" };
    }

    const valid = await bcrypt.compare(password, barista.password);
    return valid
      ? {
        valid,
        barista
      } : {
        valid,
        status: 401,
        message: 'Invalid credentials.'
      }
  } catch (err) {
    throw new Error(err);
  }
}
