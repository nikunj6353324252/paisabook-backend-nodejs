import mongoose from "mongoose";
import GroupMember from "../model/groupMemberModel.js";
import SplitTransactionItem from "../model/splitTransactionItemModel.js";
import User from "../model/userModel.js";
import { sendError } from "../utils/apiError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const listMembers = async (req, res) => {
  try {
    const members = await GroupMember.find({ groupId: req.group._id }).sort({
      createdAt: 1,
    });
    return res.status(200).json({ members });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch members");
  }
};

export const addMember = async (req, res) => {
  try {
    const { displayName, phone, linkedUserId, role } = req.body;

    if (!displayName || typeof displayName !== "string") {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Display name is required"
      );
    }

    if (linkedUserId && !isValidObjectId(linkedUserId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid linked user id");
    }

    if (linkedUserId) {
      const userExists = await User.exists({ _id: linkedUserId });
      if (!userExists) {
        return sendError(res, 404, "NOT_FOUND", "Linked user not found");
      }
    }

    const memberPayload = {
      groupId: req.group._id,
      displayName: displayName.trim(),
      linkedUserId: linkedUserId || null,
      role:
        role && ["owner", "admin", "member"].includes(role) ? role : "member",
    };

    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      memberPayload.phone = String(phone).trim();
    }

    const member = await GroupMember.create(memberPayload);

    return res.status(201).json({ member });
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Member email already exists in the group"
      );
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to add member");
  }
};

export const updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { displayName, phone, linkedUserId, role } = req.body;

    if (!isValidObjectId(memberId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid member id");
    }

    const member = await GroupMember.findOne({
      _id: memberId,
      groupId: req.group._id,
    });

    if (!member) {
      return sendError(res, 404, "NOT_FOUND", "Member not found");
    }

    if (member.role === "owner" && !req.isGroupOwner) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Only owner can update this member"
      );
    }

    if (linkedUserId && !isValidObjectId(linkedUserId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid linked user id");
    }

    if (linkedUserId) {
      const userExists = await User.exists({ _id: linkedUserId });
      if (!userExists) {
        return sendError(res, 404, "NOT_FOUND", "Linked user not found");
      }
    }

    if (displayName !== undefined) {
      member.displayName = String(displayName).trim();
    }
    if (phone !== undefined) {
      const cleanedPhone = String(phone).trim();
      member.phone = cleanedPhone === "" ? undefined : cleanedPhone;
    }
    if (linkedUserId !== undefined) {
      member.linkedUserId = linkedUserId || null;
    }
    if (role && ["owner", "admin", "member"].includes(role)) {
      if (role === "owner" && !req.isGroupOwner) {
        return sendError(
          res,
          403,
          "FORBIDDEN",
          "Only owner can assign owner role"
        );
      }
      member.role = role;
    }

    await member.save();

    return res.status(200).json({ member });
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Member email already exists in the group"
      );
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to update member");
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!isValidObjectId(memberId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid member id");
    }

    const member = await GroupMember.findOne({
      _id: memberId,
      groupId: req.group._id,
    });

    if (!member) {
      return sendError(res, 404, "NOT_FOUND", "Member not found");
    }

    if (member.role === "owner") {
      return sendError(res, 403, "FORBIDDEN", "Owner member cannot be deleted");
    }

    const splitItemCount = await SplitTransactionItem.countDocuments({
      memberId: member._id,
    });

    if (splitItemCount > 0) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Member has split items and cannot be deleted",
        { memberId }
      );
    }

    await GroupMember.deleteOne({ _id: member._id });

    return res.status(200).json({ deleted: true });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to delete member");
  }
};
