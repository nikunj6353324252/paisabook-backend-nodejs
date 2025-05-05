import express from "express";
const router = express.Router();
import {
  createIncome,
  deleteIncome,
  getIncome,
  updateIncome,
} from "../controller/incomeController.js";

router.post("/income", createIncome);
router.put("/income", updateIncome);
router.get("/income", getIncome);
router.delete("/income", deleteIncome);

export const IncomeRoutes = router;
