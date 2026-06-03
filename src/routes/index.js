import { Router } from "express";
import { router as usersRouter } from "./user.router/users.routes.js";
import { router as productsRouter } from "./product.router/product.router.js";
import { router as staffRouter } from "./staff.router/staff.router.js";
import { router as orderRouter } from "./order.router/order.router.js";
import { router as shoeRouter } from "./shoe.router/shoe.router.js";
import authUser from "../middelware/authUser.js";

export const router = Router();

router.use("/users", usersRouter);
router.use("/staff", staffRouter);
router.use("/products", productsRouter);
router.use("/order", authUser, orderRouter);
router.use("/shoes", shoeRouter);
