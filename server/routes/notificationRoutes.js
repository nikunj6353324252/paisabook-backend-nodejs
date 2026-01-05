import express from "express";
import {
  listNotifications,
  markNotificationRead,
} from "../controller/notificationController.js";

const router = express.Router();

router.get("/notifications", listNotifications);
router.put("/notifications/:id/read", markNotificationRead);

export const NotificationRoutes = router;
