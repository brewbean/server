import express from "express";
import { newUserController } from "../controllers/hooks.js";

const router = express.Router();

router.post("/new-user", newUserController);

export default router;
