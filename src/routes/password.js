import express from "express";
import {
  updatePasswordController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/password.js";

const router = express.Router();

router.post("/forgot", forgotPasswordController);
router.put("/update", updatePasswordController);
router.put("/reset", resetPasswordController);

export default router;
