import mongoose from "mongoose";
import GroupMember from "../model/groupMemberModel.js";
import Notification from "../model/notificationModel.js";
import { sendError } from "../utils/apiError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const listNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const memberships = await GroupMember.find({ linkedUserId: userId }).select(
      "_id"
    );
    const memberIds = memberships.map((member) => member._id);

    const notifications = await Notification.find({
      $or: [{ toUserId: userId }, { toMemberId: { $in: memberIds } }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch notifications"
    );
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid notification id");
    }

    const memberships = await GroupMember.find({ linkedUserId: userId }).select(
      "_id"
    );
    const memberIds = memberships.map((member) => member._id);

    const notification = await Notification.findOne({
      _id: id,
      $or: [{ toUserId: userId }, { toMemberId: { $in: memberIds } }],
    });

    if (!notification) {
      return sendError(res, 404, "NOT_FOUND", "Notification not found");
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ notification });
  } catch (error) {
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update notification"
    );
  }
};
