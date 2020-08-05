import express from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { validateCredentials } from './helpers/auth.js'

const app = express()
const PORT = process.env.PORT || 3000
const GRAPHQL_URL = process.env.GRAPHQL_URL

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.post('/signup', async (req, res) => {
  try {
    let { email, firstName, lastName, password } = req.body;

    const body = {
      query: `
      mutation ($object: barista_insert_input!) {
        insert_barista_one(object: $object) {
          id
          first_name
          last_name
          email
          created_on
        }
      }
      `,
      variables: {
        object: {
          email,
          "first_name": firstName,
          "last_name": lastName,
          password: await bcrypt.hash(password, 10),
        }
      }
    }
    let { data } = await axios.post(GRAPHQL_URL, body, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
      }
    });
    let barista = data.data.insert_barista_one;

    const tokenContent = {
      sub: '' + barista.id,
      name: barista.first_name + " " + barista.last_name,
      iat: Date.now() / 1000,
      iss: "https://brewbean-api.herokuapp.com",
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": ["barista"],
        "x-hasura-default-role": "barista",
        "x-hasura-barista-id": '' + barista.id
      }
    };
    res.json({ token: jwt.sign(tokenContent, process.env.JWT_SECRET) });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    let { valid, barista, status, message } = await validateCredentials(email, password);

    if (!valid) {
      return res.status(status).send({ error: message });
    }

    const tokenContent = {
      sub: '' + barista.id,
      name: barista.first_name + " " + barista.last_name,
      iat: Date.now() / 1000,
      iss: "https://brewbean-api.herokuapp.com",
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": ["barista"],
        "x-hasura-default-role": "barista",
        "x-hasura-barista-id": '' + barista.id
      }
    };

    res.json({
      id: barista.id,
      token: jwt.sign(tokenContent, process.env.JWT_SECRET)
    });

  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})