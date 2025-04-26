import express from "express";
const router = express.Router();
import {
  createIncome,
  deleteIncome,
  getIncome,
} from "../controller/incomeController.js";

router.post("/income", createIncome);
router.get("/income", getIncome);
router.delete("/income", deleteIncome);

export const IncomeRoutes = router;
