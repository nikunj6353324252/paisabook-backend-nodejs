import mongoose from "mongoose";
import GroupMember from "../model/groupMemberModel.js";
import Notification from "../model/notificationModel.js";
import SplitTransaction from "../model/splitTransactionModel.js";
import SplitTransactionItem from "../model/splitTransactionItemModel.js";
import { sendError } from "../utils/apiError.js";
import { parseAmountToMinor, splitEqualAmount } from "../utils/money.js";
import sendExternalMessage from "../utils/sendExternalMessage.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const listSplits = async (req, res) => {
  try {
    const splits = await SplitTransaction.find({ groupId: req.group._id }).sort(
      { occurredAt: -1 }
    );
    return res.status(200).json({ splits });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch splits");
  }
};

export const getSplit = async (req, res) => {
  try {
    const { splitId } = req.params;

    if (!isValidObjectId(splitId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid split id");
    }

    const split = await SplitTransaction.findOne({
      _id: splitId,
      groupId: req.group._id,
    });

    if (!split) {
      return sendError(res, 404, "NOT_FOUND", "Split not found");
    }

    const items = await SplitTransactionItem.find({
      splitTransactionId: split._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({ split, items });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch split");
  }
};

export const getMemberSplits = async (req, res) => {
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

    const items = await SplitTransactionItem.find({
      groupId: req.group._id,
      memberId,
    })
      .populate("splitTransactionId", "title type occurredAt currency totalAmountMinor")
      .sort({ createdAt: -1 });

    return res.status(200).json({ items });
  } catch (error) {
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch member splits"
    );
  }
};

export const createSplit = async (req, res) => {
  try {
    const {
      title,
      type,
      currency = "INR",
      totalAmount,
      occurredAt,
      note = "",
      splitMethod,
      memberIds = [],
      customAmounts = {},
    } = req.body;

    if (!title || typeof title !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "Title is required");
    }
    if (!["expense", "income"].includes(type)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid type");
    }
    if (!Array.isArray(memberIds) || memberIds.length < 2) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "At least 2 members are required"
      );
    }
    if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid occurredAt");
    }
    if (!["equal", "custom"].includes(splitMethod)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid split method");
    }

    const totalAmountMinor = parseAmountToMinor(totalAmount);
    if (totalAmountMinor === null) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid total amount"
      );
    }

    const uniqueMemberIds = [...new Set(memberIds)];
    const invalidMemberId = uniqueMemberIds.find((id) => !isValidObjectId(id));
    if (invalidMemberId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid member id");
    }

    const members = await GroupMember.find({
      _id: { $in: uniqueMemberIds },
      groupId: req.group._id,
    });

    if (members.length !== uniqueMemberIds.length) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Member list contains invalid members"
      );
    }

    let amountsMinor = [];
    if (splitMethod === "equal") {
      amountsMinor = splitEqualAmount(totalAmountMinor, uniqueMemberIds.length);
    } else {
      amountsMinor = uniqueMemberIds.map((memberId) => {
        const amount = customAmounts[memberId];
        const amountMinor = parseAmountToMinor(amount);
        if (amountMinor === null) {
          return null;
        }
        return amountMinor;
      });

      if (amountsMinor.some((amount) => amount === null)) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Custom amounts are invalid"
        );
      }

      const totalCustom = amountsMinor.reduce((sum, value) => sum + value, 0);
      if (totalCustom !== totalAmountMinor) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Custom amounts do not sum to total",
          { totalAmountMinor, totalCustom }
        );
      }
    }

    const session = await mongoose.startSession();
    let split;
    let items;
    let notifications;

    try {
      await session.withTransaction(async () => {
        split = await SplitTransaction.create(
          [
            {
              groupId: req.group._id,
              createdByUserId: req.user.userId,
              title: title.trim(),
              type,
              currency,
              totalAmountMinor,
              occurredAt: new Date(occurredAt),
              note: note?.trim() || "",
            },
          ],
          { session }
        );

        items = await SplitTransactionItem.insertMany(
          uniqueMemberIds.map((memberId, index) => ({
            splitTransactionId: split[0]._id,
            groupId: req.group._id,
            memberId,
            amountMinor: amountsMinor[index],
            direction: type === "expense" ? "owes" : "gets",
          })),
          { session }
        );

        const notificationDocs = members.map((member) => ({
          groupId: req.group._id,
          splitTransactionId: split[0]._id,
          toMemberId: member._id,
          toUserId: member.linkedUserId || null,
          title: `New ${type} split`,
          body: `${title.trim()} - ${currency} ${totalAmount}`,
        }));

        notifications = await Notification.insertMany(notificationDocs, {
          session,
        });
      });
    } finally {
      session.endSession();
    }

    await Promise.all(
      members.map((member) =>
        sendExternalMessage({
          toMember: member,
          title: `New ${type} split`,
          body: `${title.trim()} - ${currency} ${totalAmount}`,
        })
      )
    );

    return res.status(201).json({
      splitTransaction: split[0],
      items,
      notificationsCount: notifications.length,
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to create split");
  }
};
