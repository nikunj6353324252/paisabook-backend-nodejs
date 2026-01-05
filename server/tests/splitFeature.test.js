import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";
import connectDB from "../Config/dbConfig.js";
import Notification from "../model/notificationModel.js";
import User from "../model/userModel.js";

let app;
let mongoServer;

const createUserAndToken = async (overrides = {}) => {
  const uniqueSuffix = `${Date.now()}-${Math.random()}`;
  const user = await User.create({
    mobile: overrides.mobile || `99999${uniqueSuffix}`.slice(0, 14),
    email: overrides.email || `user-${uniqueSuffix}@test.dev`,
    password: "password",
    user_name: overrides.user_name || "",
  });

  const token = jwt.sign(
    { userId: user._id, mobile: user.mobile },
    process.env.JWT_SECRET
  );

  return { user, token };
};

const createGroup = async (token, name = "Trip") => {
  const response = await request(app)
    .post("/api/groups")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });
  return response.body;
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

test("create group and list groups", async () => {
  const { token } = await createUserAndToken();
  const created = await request(app)
    .post("/api/groups")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Dinner Club" });

  expect(created.status).toBe(201);

  const list = await request(app)
    .get("/api/groups")
    .set("Authorization", `Bearer ${token}`);

  expect(list.status).toBe(200);
  expect(list.body.groups).toHaveLength(1);
});

test("group access denied if not member", async () => {
  const owner = await createUserAndToken();
  const outsider = await createUserAndToken();

  const groupResponse = await request(app)
    .post("/api/groups")
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ name: "Private" });

  const groupId = groupResponse.body.group._id;

  const denied = await request(app)
    .get(`/api/groups/${groupId}`)
    .set("Authorization", `Bearer ${outsider.token}`);

  expect(denied.status).toBe(403);
  expect(denied.body.error.code).toBe("FORBIDDEN");
});

test("add/edit member authorization", async () => {
  const owner = await createUserAndToken();
  const memberUser = await createUserAndToken();

  const group = await createGroup(owner.token, "Admins");
  const groupId = group.group._id;

  const added = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      displayName: "Member",
      linkedUserId: memberUser.user._id,
      role: "member",
    });

  expect(added.status).toBe(201);

  const blockedAdd = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${memberUser.token}`)
    .send({ displayName: "New Member" });

  expect(blockedAdd.status).toBe(403);

  const blockedEdit = await request(app)
    .patch(`/api/groups/${groupId}/members/${added.body.member._id}`)
    .set("Authorization", `Bearer ${memberUser.token}`)
    .send({ displayName: "Updated Name" });

  expect(blockedEdit.status).toBe(403);
});

test("equal split rounding correctness", async () => {
  const owner = await createUserAndToken();
  const group = await createGroup(owner.token, "Trip");
  const groupId = group.group._id;
  const ownerMemberId = group.ownerMember._id;

  const secondMember = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ displayName: "Friend" });

  const splitResponse = await request(app)
    .post(`/api/groups/${groupId}/splits`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      title: "Dinner",
      type: "expense",
      currency: "INR",
      totalAmount: 10.01,
      occurredAt: new Date().toISOString(),
      splitMethod: "equal",
      memberIds: [ownerMemberId, secondMember.body.member._id],
    });

  expect(splitResponse.status).toBe(201);
  const amounts = splitResponse.body.items.map((item) => item.amountMinor);
  const total = amounts.reduce((sum, value) => sum + value, 0);

  expect(total).toBe(1001);
  expect(amounts).toContain(501);
  expect(amounts).toContain(500);
});

test("custom split sum mismatch fails", async () => {
  const owner = await createUserAndToken();
  const group = await createGroup(owner.token, "Trip");
  const groupId = group.group._id;
  const ownerMemberId = group.ownerMember._id;

  const secondMember = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ displayName: "Friend" });

  const splitResponse = await request(app)
    .post(`/api/groups/${groupId}/splits`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      title: "Custom",
      type: "expense",
      totalAmount: 12.0,
      occurredAt: new Date().toISOString(),
      splitMethod: "custom",
      memberIds: [ownerMemberId, secondMember.body.member._id],
      customAmounts: {
        [ownerMemberId]: 5.0,
        [secondMember.body.member._id]: 5.0,
      },
    });

  expect(splitResponse.status).toBe(400);
  expect(splitResponse.body.error.code).toBe("VALIDATION_ERROR");
});

test("member deletion blocked if has split items", async () => {
  const owner = await createUserAndToken();
  const group = await createGroup(owner.token, "Trip");
  const groupId = group.group._id;
  const ownerMemberId = group.ownerMember._id;

  const secondMember = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ displayName: "Friend" });

  await request(app)
    .post(`/api/groups/${groupId}/splits`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      title: "Dinner",
      type: "expense",
      totalAmount: 10.0,
      occurredAt: new Date().toISOString(),
      splitMethod: "equal",
      memberIds: [ownerMemberId, secondMember.body.member._id],
    });

  const deleteResponse = await request(app)
    .delete(`/api/groups/${groupId}/members/${secondMember.body.member._id}`)
    .set("Authorization", `Bearer ${owner.token}`);

  expect(deleteResponse.status).toBe(400);
  expect(deleteResponse.body.error.code).toBe("VALIDATION_ERROR");
});

test("notifications created for all members", async () => {
  const owner = await createUserAndToken();
  const group = await createGroup(owner.token, "Trip");
  const groupId = group.group._id;
  const ownerMemberId = group.ownerMember._id;

  const secondMember = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ displayName: "Friend" });

  const thirdMember = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ displayName: "Buddy" });

  const splitResponse = await request(app)
    .post(`/api/groups/${groupId}/splits`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      title: "Lunch",
      type: "expense",
      totalAmount: 15.0,
      occurredAt: new Date().toISOString(),
      splitMethod: "equal",
      memberIds: [
        ownerMemberId,
        secondMember.body.member._id,
        thirdMember.body.member._id,
      ],
    });

  expect(splitResponse.status).toBe(201);
  expect(splitResponse.body.notificationsCount).toBe(3);

  const notificationCount = await Notification.countDocuments();
  expect(notificationCount).toBe(3);
});
