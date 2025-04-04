const express = require("express");
const router = express.Router();
const {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgets,
} = require("../controller/budgetController");

router.post("/budget", createBudget);
router.get("/budget", getBudgets);
router.put("/budget", updateBudget);
router.delete("/budget", deleteBudget);

module.exports = { routes: router };
