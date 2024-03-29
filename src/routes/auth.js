import express from "express";
import {
  signupController,
  loginController,
  refreshTokenController,
  logoutController,
  logoutAllController,
} from "../controllers/auth.js";
import PasswordRouter from "./password.js";
import rateLimit from "express-rate-limit";
const { AUTH_RATE_LIMITER_MINUTES, AUTH_RATE_LIMIT_MAX } = process.env;

const router = express.Router();

const createAccountLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMITER_MINUTES * 60 * 1000, // 1 hour window
  max: AUTH_RATE_LIMIT_MAX, // start blocking after 5 requests
  message: "Too many attempts from this IP, please try again after an hour",
});

router.post("/signup", createAccountLimiter, signupController);
router.post("/login", createAccountLimiter, loginController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);
router.post("/logout-all", logoutAllController);

router.use("/password", PasswordRouter);

export default router;
