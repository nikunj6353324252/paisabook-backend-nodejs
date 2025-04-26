import express from "express";
import {
  saveToken,
  getAllTokens,
  deleteToken,
  getTokenByUserId,
} from "../controller/FCMTokenController.js";
const router = express.Router();

router.post("/save_token", saveToken);
router.get("/get_tokens", getAllTokens);
router.delete("/delete_token", deleteToken);
router.get("/get_token", getTokenByUserId);

export const TokenRoutes = router;
