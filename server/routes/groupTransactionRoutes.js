import express from "express";
import { sendError } from "../utils/apiError.js";
import {
  createGroupTransaction,
  listGroupTransactions,
} from "../controller/groupTransactionController.js";
import { loadGroupAndCheckMembership } from "../middleware/groupAccessMiddleware.js";

const router = express.Router();

const ensureGroupId = (req, res, next) => {
  const groupId = req.params?.groupId || req.body?.groupId || req.query?.groupId;
  if (!groupId) {
    return sendError(res, 400, "VALIDATION_ERROR", "Group id is required");
  }
  req.params.groupId = groupId;
  return next();
};

router.get(
  "/groups/:groupId/transactions",
  loadGroupAndCheckMembership,
  listGroupTransactions
);
router.post(
  "/groups/:groupId/transactions",
  loadGroupAndCheckMembership,
  createGroupTransaction
);

// Legacy paths (kept for backward compatibility).
router.get(
  "/groupTransaction",
  ensureGroupId,
  loadGroupAndCheckMembership,
  listGroupTransactions
);
router.post(
  "/groupTransaction",
  ensureGroupId,
  loadGroupAndCheckMembership,
  createGroupTransaction
);

// router.get("/groupTransaction/:groupId", getGroup);
// router.put("/groupTransaction/:groupId", requireGroupAdminOrOwner, updateGroup);
// router.delete("/groupTransaction/:groupId", deleteGroup);

export const GroupTransactionRoutes = router;
