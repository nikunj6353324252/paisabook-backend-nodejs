import mongoose from "mongoose";

const groupMemberSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // role: {
    //   type: String,
    //   enum: ["owner", "admin", "member"],
    //   default: "member",
    //   required: true,
    // },
  },
  { timestamps: true }
);

// groupMemberSchema.index(
//   { groupId: 1, phone: 1 },
//   { unique: true, sparse: true }
// );

const GroupMember = mongoose.model("GroupMember", groupMemberSchema);

export default GroupMember;
