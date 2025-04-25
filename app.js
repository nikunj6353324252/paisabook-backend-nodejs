// require("dotenv").config();
// const express = require("express");
// const path = require("path");
// const connectDB = require("./server/Config/db");
// const userRoutes = require("./server/routes/userRoutes");
// const expenseRoutes = require("./server/routes/expenseRoutes");
// const budgetRoutes = require("./server/routes/budgetRoutes");
// const incomeRoutes = require("./server/routes/incomeRoutes");
// const authMiddleware = require("./server/middleware/authMiddleware");
// const FCMTokenRoutes = require("./server/routes/FCMTokenRoutes");
// const startNotificationScheduler = require("./server/PushNotification");

// const app = express();
// app.use(express.json());
// connectDB();

// startNotificationScheduler();

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "public")));

// app.use("/api/auth", userRoutes.routes);
// app.use("/api", authMiddleware, expenseRoutes.routes);
// app.use("/api", authMiddleware, budgetRoutes.routes);
// app.use("/api", authMiddleware, incomeRoutes.routes);
// app.use("/api", FCMTokenRoutes.routes);

// app.use((req, res) => {
//   res.status(404).json({ message: "Route not found found" });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, "0.0.0.0", () =>
//   console.log(`🚀 API Server running at http://localhost:${PORT}`)
// );

require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./server/Config/db");
const userRoutes = require("./server/routes/userRoutes");
const expenseRoutes = require("./server/routes/expenseRoutes");
const budgetRoutes = require("./server/routes/budgetRoutes");
const incomeRoutes = require("./server/routes/incomeRoutes");
const authMiddleware = require("./server/middleware/authMiddleware");
const FCMTokenRoutes = require("./server/routes/FCMTokenRoutes");
const startNotificationScheduler = require("./server/PushNotification");

const app = express();
const serverless = require("serverless-http"); // ✅ important for Vercel

app.use(express.json());
connectDB();

startNotificationScheduler();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", userRoutes.routes);
app.use("/api", authMiddleware, expenseRoutes.routes);
app.use("/api", authMiddleware, budgetRoutes.routes);
app.use("/api", authMiddleware, incomeRoutes.routes);
app.use("/api", FCMTokenRoutes.routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// LOCAL ONLY
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 API Server running at http://localhost:${PORT}`)
  );
}

// ✅ Vercel Export
module.exports = app; // for testing
module.exports.handler = serverless(app); // for vercel
