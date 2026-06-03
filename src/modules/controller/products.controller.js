import mongoose from "mongoose";
import { Brand } from "../Model/Brand-model.js";
import { Products } from "../Model/products-model.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

export const getProduct = async (req, res, next) => {
  try {
    const doc = await Products.find();
    if (!doc) {
      return res.status(500).json({
        success: false,
        message: "server error can't get Product!",
        error: err,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Get Product Done!!",
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  const { name, description, brandId, category, rentalPlan, variants } =
    req.body || "";

  // console.log({
  //   modelName,
  //   description,
  //   brandId,
  //   category,
  //   rentalPlan,
  //   variants,
  // });
  if (!name || !variants || !brandId || !category || !rentalPlan) {
    return res
      .status(404)
      .json({ success: false, message: "Incomplete information." });
  }

  try {
    const doc = await Products.create({
      name: name,
      variants: variants,
      brandId: brandId,
      category: category,
      rentalPlan: rentalPlan,
    });
    return res
      .status(201)
      .json({ success: true, message: "Create successful!", data: doc });
  } catch (err) {
    next(err);
  }
};

export const createNewBrand = async (req, res, next) => {
  const { brandName, model } = req.body || {};
  const brand = String(brandName || "").trim();

  console.log(brand);
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Brand name is required!",
    });
  }

  try {
    const doc = await Brand.create({
      brandName: brand,
      model: model ? [model] : [],
    });

    return res.status(201).json({
      success: true,
      message: "Brand created successfully!",
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

export const getBrand = async (req, res, next) => {
  const { brand } = req.body || "";
  if (!brand) {
    res.status(400).json({ success: false, message: "brand not found!" });
  }

  try {
    const doc = await Brand.find(brand);
    return res
      .status(200)
      .json({ success: true, message: "founded!", data: doc });
  } catch (err) {
    next(err);
  }
};

export const getCategory = async (req, res, next) => {
  const { category } = req.body || "";
  if (!category) {
    res.status(400).json({ success: false, message: "category not found!" });
  }

  try {
    const doc = await Products.find(category);
    return res
      .status(200)
      .json({ success: true, message: "founded!", data: doc });
  } catch (err) {
    next(err);
  }
};

export const addProductModelToBrand = async (req, res, next) => {
  const { id } = req.params;
  const { modelId } = req.body || {};

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand id",
    });
  }

  if (!modelId) {
    return res.status(400).json({
      success: false,
      message: "modelId is required",
    });
  }

  if (!isValidObjectId(modelId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product model id",
    });
  }

  try {
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const productModel = await Products.findById(modelId);
    if (!productModel) {
      return res.status(404).json({
        success: false,
        message: "Product model not found",
      });
    }

    const modelIdString = productModel._id.toString();
    const alreadyExists = brand.model?.some((item) => {
      const value = item instanceof Map ? item.get("modelId") : item?.modelId;
      return value === modelIdString;
    });

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Product model already exists in this brand",
      });
    }

    const modelEntry = {
      modelId: modelIdString,
      name: productModel.name,
    };

    const updatedBrand = await Brand.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        model: { $not: { $elemMatch: { modelId: modelIdString } } },
      },
      { $addToSet: { model: modelEntry } },
      { returnDocument: "after" },
    );

    if (!updatedBrand) {
      return res.status(409).json({
        success: false,
        message: "Product model already exists in this brand",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product model added to brand successfully",
      data: {
        brand: updatedBrand,
      },
    });
  } catch (err) {
    next(err);
  }
};
