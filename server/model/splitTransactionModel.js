import mongoose from "mongoose";

const splitTransactionSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["expense", "income"], required: true },
    currency: { type: String, default: "INR" },
    totalAmountMinor: { type: Number, required: true },
    occurredAt: { type: Date, required: true },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

splitTransactionSchema.index({ groupId: 1, occurredAt: -1 });

const SplitTransaction = mongoose.model(
  "SplitTransaction",
  splitTransactionSchema
);

export default SplitTransaction;
