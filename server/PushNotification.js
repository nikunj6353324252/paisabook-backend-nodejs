const admin = require("firebase-admin");
const cron = require("node-cron");
const FCMTokenModel = require("./model/FCMTokenModel");
const serviceAccount = require("../notification.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const startNotificationScheduler = () => {
  cron.schedule("0 22 * * *", async () => {
    try {
      const tokenDocs = await FCMTokenModel.find({}, { token: 1, _id: 0 });
      const tokens = tokenDocs.map((doc) => doc.token);

      if (tokens.length === 0) {
        console.log("⚠️ No tokens found.");
        return;
      }

      const message = {
        notification: {
          title: "💰 Reminder",
          body: "Don’t forget to add today’s expense!",
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `✅ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`
      );
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Token ${tokens[idx]} failed:`, resp.error);
        }
      });
    } catch (error) {
      console.error("🔥 Notification error:", error.message);
    }
  });
};

module.exports = startNotificationScheduler;
