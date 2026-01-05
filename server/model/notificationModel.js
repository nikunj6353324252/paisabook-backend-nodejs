import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    splitTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SplitTransaction",
      required: true,
      index: true,
    },
    toMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMember",
      default: null,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ toUserId: 1, createdAt: -1 });
notificationSchema.index({ toMemberId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
