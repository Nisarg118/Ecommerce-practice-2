import { redis } from "../lib/redis.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken);
};

export const signUpController = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    //authenticate
    const { accessToken, refreshToken } = generateTokens(user._id);

    const user = await User.create({
      name,
      email,
      password,
    });
    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.log("Error in signupController : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
