import express from "express";
import {
  signupController,
  loginController,
  refreshTokenController,
  logoutController,
  logoutAllController,
  changePasswordController,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);
router.post("/logout-all", logoutAllController);
router.put("/change-password", changePasswordController);

export default router;
