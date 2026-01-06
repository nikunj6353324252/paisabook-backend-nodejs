import mongoose from "mongoose";

const groupTransactionSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

groupTransactionSchema.index({ groupId: 1, date: -1 });

const GroupTransaction = mongoose.model(
  "GroupTransaction",
  groupTransactionSchema
);

export default GroupTransaction;
