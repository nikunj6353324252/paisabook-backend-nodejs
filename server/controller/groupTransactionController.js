import GroupTransaction from "../model/groupTransactionModel.js";
import { sendError } from "../utils/apiError.js";

const parsePositiveAmount = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
};

export const createGroupTransaction = async (req, res) => {
  try {
    if (!req.group?._id) {
      return sendError(res, 400, "VALIDATION_ERROR", "Group context missing");
    }

    const { amount, note, date } = req.body;
    const parsedAmount = parsePositiveAmount(amount);

    if (parsedAmount === null) {
      return sendError(res, 400, "VALIDATION_ERROR", "Amount must be > 0");
    }

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return sendError(res, 400, "VALIDATION_ERROR", "Note is required");
    }

    if (note.trim().length > 500) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Note must be 500 characters or less"
      );
    }

    let transactionDate = new Date();
    if (date !== undefined) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return sendError(res, 400, "VALIDATION_ERROR", "Invalid date");
      }
      transactionDate = parsed;
    }

    const transaction = await GroupTransaction.create({
      groupId: req.group._id,
      amount: parsedAmount,
      note: note.trim(),
      date: transactionDate,
      createdBy: req.user.userId,
    });

    return res.status(201).json({ transaction });
  } catch (error) {
    console.log("error", error);
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to create transaction"
    );
  }
};

export const listGroupTransactions = async (req, res) => {
  try {
    if (!req.group?._id) {
      return sendError(res, 400, "VALIDATION_ERROR", "Group context missing");
    }

    const { page, limit } = req.query;
    const hasPagination = page !== undefined || limit !== undefined;

    if (!hasPagination) {
      const transactions = await GroupTransaction.find({
        groupId: req.group._id,
      }).sort({ date: -1, createdAt: -1 });
      return res.status(200).json({ transactions });
    }

    const pageNumber = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNumber = Math.min(
      100,
      Math.max(1, Number.parseInt(limit || "20", 10))
    );

    if (!Number.isFinite(pageNumber) || !Number.isFinite(limitNumber)) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid pagination values"
      );
    }

    const skip = (pageNumber - 1) * limitNumber;
    const [transactions, total] = await Promise.all([
      GroupTransaction.find({ groupId: req.group._id })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      GroupTransaction.countDocuments({ groupId: req.group._id }),
    ]);

    return res.status(200).json({
      transactions,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch transactions"
    );
  }
};
