import express from "express";
import {
  getProfileController,
  logOutController,
  refreshTokenCotroller,
  signInController,
  signUpController,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signUpController);
router.post("/login", signInController);
router.post("/logout", logOutController);
router.post("/refresh-token", refreshTokenCotroller);
router.get("/profile", protectRoute, getProfileController);

export default router;
