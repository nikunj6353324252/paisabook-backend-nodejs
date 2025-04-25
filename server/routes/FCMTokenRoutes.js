const express = require("express");
const { saveToken, getAllTokens } = require("../controller/FCMTokenController");
const router = express.Router();

router.post("/save-token", saveToken);
router.get("/get-tokens", getAllTokens);

module.exports = { routes: router };
