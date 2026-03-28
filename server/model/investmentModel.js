import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    investment_type: {
      type: String,
      required: true,
      enum: ["stock_delivery", "stock_option", "index_option"],
      index: true,
    },
    stock_name: {
      type: String,
      default: null,
      trim: true,
    },
    index_name: {
      type: String,
      default: null,
      trim: true,
    },
    buy_which_price_option: {
      type: Number,
      default: null,
      min: 0,
    },
    call_or_put: {
      type: String,
      enum: ["call", "put", null],
      default: null,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    buy_price: {
      type: Number,
      required: true,
      min: 0,
    },
    buy_price_date: {
      type: Date,
      required: true,
      index: true,
    },
    sell_price: {
      type: Number,
      default: null,
      min: 0,
    },
    sell_price_date: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["open", "completed"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;
