import mongoose from "mongoose";

const splitTransactionItemSchema = new mongoose.Schema(
  {
    splitTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SplitTransaction",
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMember",
      required: true,
      index: true,
    },
    amountMinor: { type: Number, required: true },
    direction: { type: String, enum: ["owes", "gets"], required: true },
  },
  { timestamps: true }
);

splitTransactionItemSchema.index(
  { groupId: 1, memberId: 1, createdAt: -1 },
  { name: "group_member_createdAt" }
);
splitTransactionItemSchema.index({ splitTransactionId: 1 });

const SplitTransactionItem = mongoose.model(
  "SplitTransactionItem",
  splitTransactionItemSchema
);

export default SplitTransactionItem;
