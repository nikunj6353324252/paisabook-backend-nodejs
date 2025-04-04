require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./server/Config/db");
const userRoutes = require("./server/routes/userRoutes");
const expenseRoutes = require("./server/routes/expenseRoutes");
const budgetRoutes = require("./server/routes/budgetRoutes");

const app = express();
app.use(express.json());
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", userRoutes.routes);
app.use("/api", expenseRoutes.routes);
app.use("/api", budgetRoutes.routes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API Server running at http://localhost:${PORT}`)
);
