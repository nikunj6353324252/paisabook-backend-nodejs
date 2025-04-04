const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    budget_category: {
      type: String,
      default: "",
    },
    attachment_bill: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Expense", expenseSchema);
