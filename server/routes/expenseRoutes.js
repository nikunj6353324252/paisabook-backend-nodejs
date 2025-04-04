const express = require("express");
const {
  addExpense,
  deleteExpense,
  getExpenses,
} = require("../controller/expenseController");
const router = express.Router();

router.get("/expense", getExpenses);
router.post("/expense", addExpense);
router.delete("/expense", deleteExpense);

module.exports = { routes: router };
