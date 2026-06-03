import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Brand } from "../src/modules/Model/Brand-model.js";
import { Products } from "../src/modules/Model/products-model.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const MONGODB_URI = process.env.MONGODB_URI;
const STAFF_SECRET = process.env.JWT_STAFF_SECRETKEY;

const testRunId = Date.now();
const createdIds = {
  brands: [],
  products: [],
};

const assertStatus = async (label, response, expectedStatus) => {
  const body = await response.json().catch(() => ({}));

  if (response.status !== expectedStatus) {
    throw new Error(
      `${label}: expected ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(body)}`,
    );
  }

  console.log(`[pass] ${label} -> ${response.status}`);
  return body;
};

const patchBrandModel = ({ brandId, modelId, token }) => {
  return fetch(`${API_BASE_URL}/api/products/new-brand/${brandId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(modelId === undefined ? {} : { modelId }),
  });
};

const createBrand = async (brandName) => {
  const brand = await Brand.create({ brandName, model: [] });
  createdIds.brands.push(brand._id);
  return brand;
};

const createProduct = async (brandId, nameSuffix = "") => {
  const product = await Products.create({
    name: `Test Product ${testRunId}${nameSuffix}`,
    brandId,
    category: "Road",
    rentalPlan: [{ "1day": 100, "3day": 250, "7day": 500 }],
    variants: [
      {
        skuColorCode: `TEST${testRunId}${nameSuffix}`.toUpperCase(),
        colorName: "Black",
        images: [],
        size: [{ size: 42, stock: 1 }],
      },
    ],
  });

  createdIds.products.push(product._id);
  return product;
};

const cleanup = async () => {
  if (mongoose.connection.readyState !== 1) return;

  await Products.deleteMany({ _id: { $in: createdIds.products } });
  await Brand.deleteMany({ _id: { $in: createdIds.brands } });
};

const verifyCleanup = async () => {
  const [productCount, brandCount] = await Promise.all([
    Products.countDocuments({ _id: { $in: createdIds.products } }),
    Brand.countDocuments({ _id: { $in: createdIds.brands } }),
  ]);

  if (productCount !== 0 || brandCount !== 0) {
    throw new Error(
      `cleanup failed. Remaining products: ${productCount}, remaining brands: ${brandCount}`,
    );
  }

  console.log("[pass] cleanup: temporary test data removed");
};

const main = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/test-add-product-model-to-brand.js");
  }

  if (!STAFF_SECRET) {
    throw new Error("Missing JWT_STAFF_SECRETKEY in environment");
  }

  await mongoose.connect(MONGODB_URI, { dbName: "Kinetix" });

  try {
    const healthResponse = await fetch(`${API_BASE_URL}/`);
    console.log(`[info] server reachable at ${API_BASE_URL} with / status ${healthResponse.status}`);
  } catch (err) {
    throw new Error(`Server is not reachable at ${API_BASE_URL}. Start it with npm run dev first.`);
  }

  const token = jwt.sign(
    { staffId: new mongoose.Types.ObjectId().toString() },
    STAFF_SECRET,
    { expiresIn: "15m" },
  );

  const brand = await createBrand(`Test Brand ${testRunId}`);
  const product = await createProduct(brand._id);

  const successBody = await assertStatus(
    "success: add product model to brand",
    await patchBrandModel({
      brandId: brand._id.toString(),
      modelId: product._id.toString(),
      token,
    }),
    200,
  );

  const updatedModels = successBody.data?.brand?.model || [];
  const hasModel = updatedModels.some((item) => item.modelId === product._id.toString());
  if (!hasModel) {
    throw new Error("success response does not contain the added modelId");
  }

  await assertStatus(
    "duplicate: same model cannot be added twice",
    await patchBrandModel({
      brandId: brand._id.toString(),
      modelId: product._id.toString(),
      token,
    }),
    409,
  );

  await assertStatus(
    "missing modelId",
    await patchBrandModel({
      brandId: brand._id.toString(),
      modelId: undefined,
      token,
    }),
    400,
  );

  await assertStatus(
    "invalid brand id",
    await patchBrandModel({
      brandId: "invalid-brand-id",
      modelId: product._id.toString(),
      token,
    }),
    400,
  );

  await assertStatus(
    "invalid product model id",
    await patchBrandModel({
      brandId: brand._id.toString(),
      modelId: "invalid-model-id",
      token,
    }),
    400,
  );

  await assertStatus(
    "brand not found",
    await patchBrandModel({
      brandId: new mongoose.Types.ObjectId().toString(),
      modelId: product._id.toString(),
      token,
    }),
    404,
  );

  const emptyBrand = await createBrand(`Test Empty Brand ${testRunId}`);
  await assertStatus(
    "product model not found",
    await patchBrandModel({
      brandId: emptyBrand._id.toString(),
      modelId: new mongoose.Types.ObjectId().toString(),
      token,
    }),
    404,
  );

  await assertStatus(
    "missing authorization",
    await patchBrandModel({
      brandId: brand._id.toString(),
      modelId: product._id.toString(),
    }),
    401,
  );

  await assertStatus(
    "invalid authorization",
    await patchBrandModel({
      brandId: brand._id.toString(),
      modelId: product._id.toString(),
      token: "invalid-token",
    }),
    401,
  );

  await cleanup();
  await verifyCleanup();

  console.log("[done] PATCH /api/products/new-brand/:id integration checks passed");
};

try {
  await main();
} finally {
  await cleanup().catch((err) => {
    console.error(`[cleanup warning] ${err.message}`);
  });
  await mongoose.disconnect();
}
