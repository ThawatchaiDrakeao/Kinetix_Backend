import { Router } from "express";
import authUser from "../../middelware/authUser.js";
import {
  deleteUserById,
  getUserById,
  login,
  registerUser,
  updateUserById,
} from "../../modules/controller/user.controller.js";

export const router = Router();

router.post("/register", registerUser);
router.post("/login", login);

router.get("/:id", authUser, getUserById);
router.patch("/:id", authUser, updateUserById);
router.delete("/:id", authUser, deleteUserById);
