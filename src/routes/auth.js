import express from "express";
import {
  signupController,
  loginController,
  refreshTokenController,
  logoutController,
  logoutAllController,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);
router.post("/logout-all", logoutAllController);

export default router;
