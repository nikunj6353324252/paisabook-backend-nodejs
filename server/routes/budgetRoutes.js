import express from "express";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgets,
} from "../controller/budgetController.js";

const router = express.Router();

router.post("/budget", createBudget);
router.get("/budget", getBudgets);
router.put("/budget", updateBudget);
router.delete("/budget", deleteBudget);

export const BudgetRoutes = router;
