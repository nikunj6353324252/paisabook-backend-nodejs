import express from "express";
const router = express.Router();
import {
  addExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../controller/expenseController.js";
import upload from "../Config/multerConfig.js";

router.get("/expense", getExpenses);
router.post("/expense", upload.single("attachment_bill"), addExpense);
router.put("/expense", upload.single("attachment_bill"), updateExpense);
router.delete("/expense", deleteExpense);

export const ExpenseRoutes = router;
