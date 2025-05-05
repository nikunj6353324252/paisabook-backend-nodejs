import express from "express";
const router = express.Router();
import {
  addExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../controller/expenseController.js";

router.get("/expense", getExpenses);
router.post("/expense", addExpense);
router.put("/expense", updateExpense);
router.delete("/expense", deleteExpense);

export const ExpenseRoutes = router;
