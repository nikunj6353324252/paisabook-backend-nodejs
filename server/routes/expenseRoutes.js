import express from "express";
const router = express.Router();
import {
  addExpense,
  deleteExpense,
  getExpenses,
} from "../controller/expenseController.js";

router.get("/expense", getExpenses);
router.post("/expense", addExpense);
router.delete("/expense", deleteExpense);

export const ExpenseRoutes = router;
