import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import auth from './auth/index.js'

const app = express()
const PORT = process.env.PORT || 3000

app.disable('x-powered-by')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(morgan('tiny'))
app.use(cors({
  credentials: true,
  origin: true
}));

app.use('/auth', auth)

// error handler
app.use((err, _req, res, _next) => {
  if (err) {
    console.error(err.message);
    console.error(err.stack);
    return res.status(err.output.statusCode || 500).json(err.output.payload);
  }
});

app.listen(PORT, () => {
  console.log(`App 👂 at http://localhost:${PORT}`)
})