import mongoose from "mongoose";
import Group from "../model/groupModel.js";
import GroupMember from "../model/groupMemberModel.js";
import { sendError } from "../utils/apiError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const loadGroupAndCheckMembership = async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;

  if (!isValidObjectId(groupId)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid group id");
  }

  const group = await Group.findById(groupId);
  if (!group) {
    return sendError(res, 404, "NOT_FOUND", "Group not found");
  }

  const isOwner = group.ownerUserId.toString() === String(userId);
  let membership = null;

  if (!isOwner) {
    membership = await GroupMember.findOne({
      groupId: group._id,
      linkedUserId: userId,
    });

    if (!membership) {
      return sendError(res, 403, "FORBIDDEN", "Group access denied");
    }
  }

  req.group = group;
  req.groupMembership = membership;
  req.isGroupOwner = isOwner;
  return next();
};

export const requireGroupAdminOrOwner = (req, res, next) => {
  if (req.isGroupOwner) {
    return next();
  }

  const role = req.groupMembership?.role;
  if (role === "admin" || role === "owner") {
    return next();
  }

  return sendError(res, 403, "FORBIDDEN", "Admin or owner access required");
};
