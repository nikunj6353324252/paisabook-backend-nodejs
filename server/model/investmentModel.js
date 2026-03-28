import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    investment_name: {
      type: String,
      required: true,
      trim: true,
    },
    investment_type: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      default: "",
      trim: true,
    },
    invested_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    current_value: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    average_buy_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    current_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    investment_date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;
