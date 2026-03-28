import mongoose from "mongoose";

const investmentHistorySchema = new mongoose.Schema(
  {
    investment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    snapshot_date: {
      type: Date,
      required: true,
      index: true,
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
    profit_loss: {
      type: Number,
      required: true,
    },
    profit_loss_percentage: {
      type: Number,
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

const InvestmentHistory = mongoose.model(
  "InvestmentHistory",
  investmentHistorySchema
);

export default InvestmentHistory;
