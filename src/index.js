import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import boom from "@hapi/boom";

import auth from "./routes/auth.js";
import verify from "./routes/verify.js";
import hooks from "./routes/hooks.js";

const { DOMAIN, PORT, RATE_LIMITER_MINUTES, RATE_LIMITER_MAX } = process.env;

const app = express();

const whitelist = [DOMAIN];
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(boom.unauthorized("Not allowed by CORS"));
    }
  },
};
const limiter = rateLimit({
  windowMs: RATE_LIMITER_MINUTES * 60 * 1000, // 15 minutes
  max: RATE_LIMITER_MAX, // limit each IP to 100 requests per windowMs
});

app.set("trust proxy", 1);
app.use(helmet());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(cors(corsOptions));

app.use(limiter);
app.use("/auth", auth);
app.use("/verify", verify);
app.use("/hooks", hooks);

// error handler
app.use((err, _req, res, _next) => {
  if (err) {
    console.error("\x1b[41m%s\x1b[0m", err.message);
    console.error("\x1b[35m%s\x1b[0m", err.stack);
    return res.status(err.output.statusCode || 500).json(err.output.payload);
  }
});

app.listen(PORT || 4000, () => {
  console.log(`App 👂 at http://localhost:${PORT || 4000}`);
});
