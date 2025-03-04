import express from "express";
import {
  logOutController,
  refreshTokenCotroller,
  signInController,
  signUpController,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signUpController);
router.post("/login", signInController);
router.post("/logout", logOutController);
router.post("/refresh-token", refreshTokenCotroller);
// router.get("/profile", getProfileController);

export default router;
