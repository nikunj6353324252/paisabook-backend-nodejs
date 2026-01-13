import mongoose from "mongoose";
import GroupMember from "../model/groupMemberModel.js";
import SplitTransactionItem from "../model/splitTransactionItemModel.js";
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
    const { displayName, phone, name, memberName } = req.body;
    const groupId = req.group?._id || req.params?.groupId;
    const resolvedDisplayName = displayName ?? name ?? memberName;

    if (!groupId || !isValidObjectId(groupId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid group id");
    }

    if (!resolvedDisplayName || typeof resolvedDisplayName !== "string") {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Display name is required"
      );
    }

    const memberPayload = {
      groupId,
      displayName: resolvedDisplayName.trim(),
    };

    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      memberPayload.phone = String(phone).trim();
    }

    const member = await GroupMember.create(memberPayload);

    return res.status(201).json({ member });
  } catch (error) {
    console.log("error", error);
    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Member phone already exists in the group"
      );
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to add member");
  }
};

export const updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { displayName, phone } = req.body;

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

    if (displayName !== undefined) {
      member.displayName = String(displayName).trim();
    }
    if (phone !== undefined) {
      const cleanedPhone = String(phone).trim();
      member.phone = cleanedPhone === "" ? undefined : cleanedPhone;
    }

    await member.save();

    return res.status(200).json({ member });
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Member phone already exists in the group"
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
