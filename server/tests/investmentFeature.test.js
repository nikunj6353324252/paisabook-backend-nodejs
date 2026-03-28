import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";
import connectDB from "../Config/dbConfig.js";
import User from "../model/userModel.js";

let app;
let mongoServer;

const createUserAndToken = async (overrides = {}) => {
  const uniqueSuffix = `${Date.now()}-${Math.random()}`;
  const user = await User.create({
    mobile: overrides.mobile || `99999${uniqueSuffix}`.slice(0, 14),
    email: overrides.email || `investor-${uniqueSuffix}@test.dev`,
    password: "password",
    user_name: overrides.user_name || "Investor",
  });

  const token = jwt.sign(
    { userId: user._id, mobile: user.mobile },
    process.env.JWT_SECRET
  );

  return { user, token };
};

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDB();
  app = (await import("../app.js")).default;
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("creates an investment with initial history snapshot", async () => {
  const { user, token } = await createUserAndToken();

  const response = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_name: "Nifty Index Fund",
      investment_type: "mutual_fund",
      invested_amount: 10000,
      current_value: 10800,
      investment_date: "2026-01-10T00:00:00.000Z",
      snapshot_date: "2026-01-10T00:00:00.000Z",
    });

  expect(response.status).toBe(201);
  expect(response.body.investment.investment_name).toBe("Nifty Index Fund");
  expect(response.body.history.profit_loss).toBe(800);
  expect(response.body.history.profit_loss_percentage).toBe(8);
});

test("aggregates investment history by month using latest snapshot per investment", async () => {
  const { user, token } = await createUserAndToken();

  const createInvestmentResponse = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_name: "Bluechip Fund",
      investment_type: "mutual_fund",
      invested_amount: 10000,
      current_value: 10000,
      investment_date: "2026-01-01T00:00:00.000Z",
      snapshot_date: "2026-01-01T00:00:00.000Z",
    });

  const investmentId = createInvestmentResponse.body.investment._id;

  await request(app)
    .post("/api/investment/history")
    .set("Authorization", `Bearer ${token}`)
    .send({
      investment_id: investmentId,
      user_id: user._id,
      current_value: 11000,
      snapshot_date: "2026-01-15T00:00:00.000Z",
      sync_current_value: false,
    });

  await request(app)
    .post("/api/investment/history")
    .set("Authorization", `Bearer ${token}`)
    .send({
      investment_id: investmentId,
      user_id: user._id,
      current_value: 12000,
      snapshot_date: "2026-01-28T00:00:00.000Z",
      sync_current_value: false,
    });

  await request(app)
    .post("/api/investment/history")
    .set("Authorization", `Bearer ${token}`)
    .send({
      investment_id: investmentId,
      user_id: user._id,
      current_value: 12500,
      snapshot_date: "2026-02-10T00:00:00.000Z",
      sync_current_value: false,
    });

  const historyResponse = await request(app)
    .get("/api/investment/history")
    .set("Authorization", `Bearer ${token}`)
    .query({
      user_id: user._id.toString(),
      filter: "monthly",
      timezone: "UTC",
    });

  expect(historyResponse.status).toBe(200);
  expect(historyResponse.body.history).toHaveLength(2);
  expect(historyResponse.body.history[0].period).toBe("2026-01");
  expect(historyResponse.body.history[0].total_current_value).toBe(12000);
  expect(historyResponse.body.history[0].total_profit_loss).toBe(2000);
  expect(historyResponse.body.history[1].period).toBe("2026-02");
  expect(historyResponse.body.history[1].total_current_value).toBe(12500);
  expect(historyResponse.body.summary.total_current_value).toBe(12500);
});

test("aggregates investment history by year across multiple investments", async () => {
  const { user, token } = await createUserAndToken();

  const equity = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_name: "Equity",
      investment_type: "stock",
      invested_amount: 5000,
      current_value: 6500,
      investment_date: "2025-04-01T00:00:00.000Z",
      snapshot_date: "2025-12-31T00:00:00.000Z",
    });

  const gold = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_name: "Gold ETF",
      investment_type: "etf",
      invested_amount: 7000,
      current_value: 8400,
      investment_date: "2026-01-05T00:00:00.000Z",
      snapshot_date: "2026-06-30T00:00:00.000Z",
    });

  await request(app)
    .post("/api/investment/history")
    .set("Authorization", `Bearer ${token}`)
    .send({
      investment_id: equity.body.investment._id,
      user_id: user._id,
      invested_amount: 5000,
      current_value: 6800,
      snapshot_date: "2026-07-31T00:00:00.000Z",
      sync_current_value: false,
    });

  const historyResponse = await request(app)
    .get("/api/investment/history")
    .set("Authorization", `Bearer ${token}`)
    .query({
      user_id: user._id.toString(),
      filter: "yearly",
      timezone: "UTC",
    });

  expect(historyResponse.status).toBe(200);
  expect(historyResponse.body.history).toHaveLength(2);
  expect(historyResponse.body.history[0].period).toBe("2025");
  expect(historyResponse.body.history[0].total_profit_loss).toBe(1500);
  expect(historyResponse.body.history[1].period).toBe("2026");
  expect(historyResponse.body.history[1].total_invested_amount).toBe(12000);
  expect(historyResponse.body.history[1].total_current_value).toBe(15200);
  expect(historyResponse.body.history[1].total_profit_loss).toBe(3200);
});
