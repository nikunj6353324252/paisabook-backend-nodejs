const express = require("express");
const router = express.Router();
const {
  createIncome,
  deleteIncome,
  getIncome,
} = require("../controller/incomeController");

router.post("/income", createIncome);
router.get("/income", getIncome);
router.delete("/income", deleteIncome);

module.exports = { routes: router };
