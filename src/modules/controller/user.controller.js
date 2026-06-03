import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../Model/users-model.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => {
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

const isOwner = (req) => {
  return req.user?._id?.toString() === req.params.id;
};

const isValidUserId = (req, res) => {
  if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return true;
  }

  res.status(400).json({
    success: false,
    message: "Invalid user id",
  });

  return false;
};

export const registerUser = async (req, res, next) => {
  const { name, email, password, address } = req.body || {};

  const trimName = String(name || "").trim();
  const trimEmail = String(email || "").trim().toLowerCase();

  if (!trimName || !trimEmail || !password) {
    const err = new Error("name, email, password are required!");
    err.success = false;
    err.name = "ValidationError";
    err.status = 400;
    return next(err);
  }

  if (!EMAIL_PATTERN.test(trimEmail)) {
    const err = new Error("Invalid email format");
    err.name = "WrongPattern";
    err.status = 400;
    return next(err);
  }

  try {
    const doc = await User.create({
      name: trimName,
      email: trimEmail,
      password,
      ...(address ? { address } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully!",
      data: sanitizeUser(doc),
    });
  } catch (err) {
    err.status = err.status || 400;
    err.message = err.message || "Create user failed";
    return next(err);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body || {};
  const userEmail = String(email || "").trim().toLowerCase();

  if (!userEmail || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email: userEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRETKEY, {
      expiresIn: "2h",
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 2 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login success!",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        userRank: user.userRank,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (!isValidUserId(req, res)) return;

    if (!isOwner(req)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own user data",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    if (!isValidUserId(req, res)) return;

    if (!isOwner(req)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own user data",
      });
    }

    const allowedFields = ["name", "surname", "email", "password", "address"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.email) {
      updates.email = String(updates.email).trim().toLowerCase();

      if (!EMAIL_PATTERN.test(updates.email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
    }

    if (updates.name) {
      updates.name = String(updates.name).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    Object.assign(user, updates);

    await user.save({
      validateModifiedOnly: true,
    });

    return res.status(200).json({
      success: true,
      message: "Update user success",
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    if (!isValidUserId(req, res)) return;

    if (!isOwner(req)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.clearCookie("accessToken");

    return res.status(200).json({
      success: true,
      message: "Delete user success",
    });
  } catch (err) {
    next(err);
  }
};
