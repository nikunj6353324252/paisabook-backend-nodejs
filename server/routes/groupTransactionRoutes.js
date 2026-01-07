import express from "express";
// import { requireGroupAdminOrOwner } from "../middleware/groupAccessMiddleware";
import {
  createGroupTransaction,
  listGroupTransactions,
} from "../controller/groupTransactionController.js";

const router = express.Router();

router.get("/groupTransaction", listGroupTransactions);
router.post("/groupTransaction", createGroupTransaction);

// router.get("/groupTransaction/:groupId", getGroup);
// router.put("/groupTransaction/:groupId", requireGroupAdminOrOwner, updateGroup);
// router.delete("/groupTransaction/:groupId", deleteGroup);

export const GroupTransactionRoutes = router;
