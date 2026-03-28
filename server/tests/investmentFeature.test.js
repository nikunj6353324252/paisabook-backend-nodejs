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

test("creates buy-only stock delivery trade as open position", async () => {
  const { user, token } = await createUserAndToken();

  const response = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "stock_delivery",
      stock_name: "Reliance",
      buy_price: 100,
      buy_price_date: "2026-03-28T00:00:00.000Z",
      quantity: 2,
      sell_price: 200,
      sell_price_date: "2026-03-30T00:00:00.000Z",
    });

  expect(response.status).toBe(201);
  expect(response.body.message).toBe("Trade created successfully");
  expect(response.body.investment.stock_name).toBe("Reliance");
  expect(response.body.investment.sell_price).toBeNull();
  expect(response.body.investment.sell_price_date).toBeNull();
  expect(response.body.investment.status).toBe("open");
  expect(response.body.investment.profit_loss).toBeNull();
  expect(response.body.investment.roi).toBeNull();
  expect(response.body.investment.total_buy_amount).toBe(200);
  expect(response.body.investment.total_sell_amount).toBeNull();
});

test("returns user trades and keeps open and completed states separate", async () => {
  const { user, token } = await createUserAndToken();

  const openTrade = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "stock_option",
      stock_name: "TCS",
      buy_which_price_option: 4200,
      call_or_put: "call",
      quantity: 2,
      buy_price: 120,
      buy_price_date: "2026-03-20T00:00:00.000Z",
    });

  const completedSeed = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "index_option",
      index_name: "NIFTY",
      buy_which_price_option: 23000,
      call_or_put: "put",
      quantity: 1,
      buy_price: 90,
      buy_price_date: "2026-03-10T00:00:00.000Z",
    });

  await request(app)
    .put(`/api/investment?id=${completedSeed.body.investment._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "index_option",
      index_name: "NIFTY",
      buy_which_price_option: 23000,
      call_or_put: "put",
      quantity: 1,
      buy_price: 90,
      buy_price_date: "2026-03-10T00:00:00.000Z",
      sell_price: 120,
      sell_price_date: "2026-03-25T00:00:00.000Z",
      status: "completed",
    });

  const response = await request(app)
    .get("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .query({
      user_id: user._id.toString(),
    });

  expect(response.status).toBe(200);
  expect(response.body.investments).toHaveLength(2);

  const openInvestment = response.body.investments.find(
    (trade) => trade._id === openTrade.body.investment._id
  );
  const completedInvestment = response.body.investments.find(
    (trade) => trade._id === completedSeed.body.investment._id
  );

  expect(openInvestment.status).toBe("open");
  expect(openInvestment.profit_loss).toBeNull();
  expect(openInvestment.roi).toBeNull();
  expect(completedInvestment.status).toBe("completed");
  expect(completedInvestment.profit_loss).toBe(30);
  expect(completedInvestment.roi).toBe(33.33);
  expect(completedInvestment.total_buy_amount).toBe(90);
  expect(completedInvestment.total_sell_amount).toBe(120);
});

test("completes an open trade through put update", async () => {
  const { user, token } = await createUserAndToken();

  const createResponse = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "stock_option",
      stock_name: "TCS",
      buy_which_price_option: 4200,
      call_or_put: "call",
      quantity: 2,
      buy_price: 120,
      buy_price_date: "2026-03-20T00:00:00.000Z",
    });

  const updateResponse = await request(app)
    .put(`/api/investment?id=${createResponse.body.investment._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "stock_option",
      stock_name: "TCS",
      buy_which_price_option: 4200,
      call_or_put: "call",
      quantity: 2,
      buy_price: 120,
      buy_price_date: "2026-03-20T00:00:00.000Z",
      sell_price: 180,
      sell_price_date: "2026-03-25T00:00:00.000Z",
      status: "completed",
    });

  expect(updateResponse.status).toBe(200);
  expect(updateResponse.body.message).toBe("Trade updated successfully");
  expect(updateResponse.body.investment.status).toBe("completed");
  expect(updateResponse.body.investment.sell_price).toBe(180);
  expect(updateResponse.body.investment.sell_price_date).toBe(
    "2026-03-25T00:00:00.000Z"
  );
  expect(updateResponse.body.investment.profit_loss).toBe(120);
  expect(updateResponse.body.investment.roi).toBe(50);
  expect(updateResponse.body.investment.total_buy_amount).toBe(240);
  expect(updateResponse.body.investment.total_sell_amount).toBe(360);
});

test("rejects completed update without sell details", async () => {
  const { user, token } = await createUserAndToken();

  const createResponse = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "stock_delivery",
      stock_name: "Infosys",
      buy_price: 1450,
      buy_price_date: "2026-03-12T00:00:00.000Z",
    });

  const updateResponse = await request(app)
    .put(`/api/investment?id=${createResponse.body.investment._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "stock_delivery",
      stock_name: "Infosys",
      buy_price: 1450,
      buy_price_date: "2026-03-12T00:00:00.000Z",
      status: "completed",
    });

  expect(updateResponse.status).toBe(400);
  expect(updateResponse.body.message).toContain("sell_price");
});

test("deletes a trade", async () => {
  const { user, token } = await createUserAndToken();

  const createResponse = await request(app)
    .post("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: user._id,
      investment_type: "index_option",
      index_name: "BANKNIFTY",
      buy_which_price_option: 51000,
      call_or_put: "call",
      buy_price: 250,
      buy_price_date: "2026-03-18T00:00:00.000Z",
    });

  const deleteResponse = await request(app)
    .delete("/api/investment")
    .set("Authorization", `Bearer ${token}`)
    .query({
      id: createResponse.body.investment._id,
      user_id: user._id.toString(),
    });

  expect(deleteResponse.status).toBe(200);
  expect(deleteResponse.body.message).toBe("Trade deleted successfully");
});
