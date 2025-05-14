import express from "express";
const router = express.Router();
import multer from "multer";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} from "../controller/userController.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getUserProfile);
router.put(
  "/update_profile",
  upload.single("profile_image"),
  updateUserProfile
);

export const UserRoutes = router;
