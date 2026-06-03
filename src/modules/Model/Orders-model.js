import mongoose from "mongoose";

import { rentalSchema } from "./products-model.js";

const OrdersItem = new mongoose.Schema({
  ProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  status: { type: String, required: true },
  rental_plan: rentalSchema,
  sku_color_code: { type: String, required: true, trim: true },
  deposit_amount: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  // costomerId:ObjectId(001),
  status: {
    type: String,
    required: true,
    enum: ["successful", "Waiting", "Fail", "Done"],
    default: "Waiting",
  },
  ordered_at: { type: Date, default: Date.now },
  delivery_shipping_date: { type: Date },
  delivery_confirm_date: { type: Date },
  delivery_date: { type: Date },
  item: OrdersItem,
  suspended_at: { type: Date },
  rental_stat_at: { type: Date },
  canceled_at: { type: Date },
  // soft delete flag — false means the order is deactivated, not physically removed
  is_active: { type: Boolean, default: true },
});

export const Orders = mongoose.model("order", orderSchema);
