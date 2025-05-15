import express from "express";
const router = express.Router();
import {
  createIncome,
  deleteIncome,
  getIncome,
  updateIncome,
} from "../controller/incomeController.js";
import upload from "../Config/multerConfig.js";

router.post("/income", upload.single("attach_reciept"), createIncome);
router.put("/income", upload.single("attach_reciept"), updateIncome);
router.get("/income", getIncome);
router.delete("/income", deleteIncome);

export const IncomeRoutes = router;
