const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    budget_category: {
      type: String,
      required: true,
    },
    budget_limit: {
      type: Number,
      required: true,
    },
    budget_period: {
      type: String,
      required: true,
    },
    spend: {
      type: Number,
      default: 0,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Budget", budgetSchema);
