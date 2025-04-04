const express = require("express");
const {
  addExpense,
  deleteExpense,
  getExpenses,
} = require("../controller/expenseController");
const router = express.Router();

router.get("/api/expense", getExpenses);
router.post("/api/expense", addExpense);
router.delete("/api/expense", deleteExpense);

module.exports = { routes: router };
