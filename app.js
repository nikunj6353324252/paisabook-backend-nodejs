import dotenv from "dotenv";
import express from "express";
import path from "path";
import connectDB from "./server/Config/db.js";
import { UserRoutes } from "./server/routes/userRoutes.js";
import { ExpenseRoutes } from "./server/routes/expenseRoutes.js";
import { BudgetRoutes } from "./server/routes/budgetRoutes.js";
import { IncomeRoutes } from "./server/routes/incomeRoutes.js";
import authMiddleware from "./server/middleware/authMiddleware.js";
import { TokenRoutes } from "./server/routes/FCMTokenRoutes.js";
import startNotificationScheduler from "./server/PushNotification.js";

dotenv.config(); 

const app = express();
connectDB(); 

startNotificationScheduler(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), "public"))); 

app.use("/api/auth", UserRoutes);
app.use("/api", authMiddleware, ExpenseRoutes);
app.use("/api", authMiddleware, BudgetRoutes);
app.use("/api", authMiddleware, IncomeRoutes);
app.use("/api", TokenRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API Server running at http://localhost:${PORT}`)
);
