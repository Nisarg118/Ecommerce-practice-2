import express from "express";
import { signUpController } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signUpController);
// router.post("/login", signUpController);
// router.post("/logout", signUpController);

export default router;
