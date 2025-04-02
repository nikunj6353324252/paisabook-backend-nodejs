const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserProfile,
} = require("../controller/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update_profile", updateUserProfile);

module.exports = { routes: router };
