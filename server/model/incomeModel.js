import mongoose from "mongoose";
import { type } from "os";

const incomeSchema = new mongoose.Schema(
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
    income_category: {
      type: String,
      required: true,
    },
    attach_reciept: {
      type: String,
      default: "",
    },
    attachment_public_id: {
      type: String,
      default: "",
    },
    isImage: {
      type: Boolean,
      default: false,
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

const Income = mongoose.model("Income", incomeSchema);

export default Income;
