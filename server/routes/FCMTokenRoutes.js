const express = require("express");
const {
  saveToken,
  getAllTokens,
  deleteToken,
  getTokenByUserId,
} = require("../controller/FCMTokenController");
const router = express.Router();

router.post("/save_token", saveToken);
router.get("/get_tokens", getAllTokens);
router.delete("/delete_token", deleteToken);
router.get("/get_token", getTokenByUserId);

module.exports = { routes: router };
