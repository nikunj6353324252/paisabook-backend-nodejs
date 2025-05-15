import express from "express";
const router = express.Router();
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} from "../controller/userController.js";
import upload from "../Config/multerConfig.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getUserProfile);
router.put(
  "/update_profile",
  upload.single("profile_image"),
  updateUserProfile
);

export const UserRoutes = router;
