import { Router } from "express";
import authUser from "../../middelware/authUser.js";
import authStaff from "../../middelware/authStaff.js";
import {
  createNewBrand,
  createProduct,
  getProduct,
} from "../../modules/controller/products.controller.js";

import {
  getBrand,
  getCategory,
} from "../../modules/controller/products.controller.js";

export const router = Router();

router.get("/", getProduct);
router.post("/createProduct", createProduct);
router.post("/newBrand", createNewBrand);

router.get("/:brand", getBrand)

router.get("/:category", getCategory)


