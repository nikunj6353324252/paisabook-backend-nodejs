import express from "express";
import {
  createInvestment,
  createInvestmentHistory,
  deleteInvestment,
  getInvestmentHistory,
  getInvestments,
  updateInvestment,
} from "../controller/investmentController.js";

const router = express.Router();

router.get("/investment", getInvestments);
router.post("/investment", createInvestment);
router.put("/investment", updateInvestment);
router.delete("/investment", deleteInvestment);

router.get("/investment/history", getInvestmentHistory);
router.post("/investment/history", createInvestmentHistory);

export const InvestmentRoutes = router;
