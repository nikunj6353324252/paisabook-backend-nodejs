import dotenv from "dotenv";
import express from "express";
import path from "path";
import connectDB from "./Config/db.js";
import { UserRoutes } from "./routes/userRoutes.js";
import { ExpenseRoutes } from "./routes/expenseRoutes.js";
import { BudgetRoutes } from "./routes/budgetRoutes.js";
import { IncomeRoutes } from "./routes/incomeRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import { TokenRoutes } from "./routes/FCMTokenRoutes.js";
import startNotificationScheduler from "./PushNotification.js";
import cors from "cors";

dotenv.config();

const app = express();
connectDB();

startNotificationScheduler();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), "public")));

app.use("/api/auth", UserRoutes);
app.use("/api", authMiddleware, ExpenseRoutes);
app.use("/api", authMiddleware, BudgetRoutes);
app.use("/api", authMiddleware, IncomeRoutes);
app.use("/api", authMiddleware, TokenRoutes);

// app.use('/', (req, res) => res.json("server working...."));

// app.use('*', (req, res) => res.json("API route not found"));

const PORT = process.env.PORT || 3010;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API Server running at http://localhost:${PORT}`)
);
