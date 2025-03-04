import { redis } from "../lib/redis.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
// import comparePassword from "";

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
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, //prevent XSS attack,cross site scripting attack
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevents CSRF attack,cross-site request forgery attack
    maxAge: 15 * 60 * 1000, //in ms (15 min)
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //prevent XSS attack,cross site scripting attack
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevents CSRF attack,cross-site request forgery attack
    maxAge: 7 * 24 * 60 * 60 * 1000, //in ms (15 min)
  });
};

export const signUpController = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    //authenticate
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.log("Error in signupController : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signInController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);

      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid credenials" });
    }
  } catch (error) {
    console.log("Error in signInController : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logOutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logOutController : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//refresh the access token
export const refreshTokenCotroller = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true, //prevent XSS attack,cross site scripting attack
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", //prevents CSRF attack,cross-site request forgery attack
      maxAge: 15 * 60 * 1000, //in ms (15 min)
    });

    return res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// export const getProfileController=async (req,res)=>{

// }
