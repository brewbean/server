import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'

import auth from './auth/index.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('tiny'));

app.use('/auth', auth)

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})