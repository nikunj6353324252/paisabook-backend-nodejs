import mongoose from "mongoose";
import Group from "../model/groupModel.js";
import GroupMember from "../model/groupMemberModel.js";
import Notification from "../model/notificationModel.js";
import SplitTransaction from "../model/splitTransactionModel.js";
import SplitTransactionItem from "../model/splitTransactionItemModel.js";
import User from "../model/userModel.js";
import { sendError } from "../utils/apiError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// export const listGroups = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const memberships = await GroupMember.find({ linkedUserId: userId }).select(
//       "groupId"
//     );
//     const memberGroupIds = memberships.map((member) => member.groupId);

//     const groups = await Group.find({
//       $or: [{ ownerUserId: userId }, { _id: { $in: memberGroupIds } }],
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({ groups });
//   } catch (error) {
//     return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch groups");
//   }
// };

export const listGroups = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // groups where user is a member (not owner)
    const memberships = await GroupMember.find({ linkedUserId: userId }).select(
      "groupId"
    );
    const memberGroupIds = memberships.map((m) => m.groupId);

    const match = {
      $or: [{ ownerUserId: userId }, { _id: { $in: memberGroupIds } }],
    };

    const groups = await Group.aggregate([
      { $match: match },

      // join members
      {
        $lookup: {
          from: "groupmembers", // collection name in mongo (usually plural lowercase)
          localField: "_id",
          foreignField: "groupId",
          as: "members",
        },
      },

      // add memberLength
      {
        $addFields: {
          memberLength: { $size: "$members" },
        },
      },

      // remove members array (optional)
      {
        $project: {
          members: 0,
        },
      },

      // sort latest first
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({ groups });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch groups");
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name || typeof name !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "Group name is required");
    }

    const session = await mongoose.startSession();
    let group;
    let ownerMember;

    try {
      await session.withTransaction(async () => {
        group = await Group.create(
          [
            {
              name: name.trim(),
              ownerUserId: userId,
            },
          ],
          { session }
        );

        const ownerUser = await User.findById(userId).session(session);
        const displayName =
          ownerUser?.user_name?.trim() ||
          ownerUser?.email ||
          ownerUser?.mobile ||
          "Owner";

        ownerMember = await GroupMember.create(
          [
            {
              groupId: group[0]._id,
              displayName,
              phone: ownerUser?.mobile || undefined,
              email: ownerUser?.email || undefined,
              linkedUserId: userId,
              role: "owner",
            },
          ],
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    return res.status(201).json({
      group: group[0],
      ownerMember: ownerMember[0],
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to create group");
  }
};

export const getGroup = async (req, res) => {
  return res.status(200).json({ group: req.group });
};

export const updateGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "Group name is required");
    }

    const group = await Group.findByIdAndUpdate(
      req.group._id,
      { name: name.trim() },
      { new: true }
    );

    return res.status(200).json({ group });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to update group");
  }
};

export const deleteGroup = async (req, res) => {
  try {
    if (!req.isGroupOwner) {
      return sendError(res, 403, "FORBIDDEN", "Only owner can delete group");
    }

    const groupId = req.group._id;
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await GroupMember.deleteMany({ groupId }).session(session);
        await SplitTransactionItem.deleteMany({ groupId }).session(session);
        await SplitTransaction.deleteMany({ groupId }).session(session);
        await Notification.deleteMany({ groupId }).session(session);
        await Group.deleteOne({ _id: groupId }).session(session);
      });
    } finally {
      session.endSession();
    }

    return res.status(200).json({ deleted: true });
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Unable to delete group at the moment"
      );
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to delete group");
  }
};
