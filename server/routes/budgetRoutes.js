const express = require("express");
const router = express.Router();
const {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} = require("../controller/budgetController");

router.post("/budget", createBudget);
router.get("/budget", getAllBudgets);
router.get("/budget", getBudgetById);
router.put("/budget", updateBudget);
router.delete("/budget", deleteBudget);

module.exports = { routes: router };
