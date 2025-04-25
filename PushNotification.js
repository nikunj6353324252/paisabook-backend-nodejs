const admin = require("firebase-admin");
const cron = require("node-cron");
const FCMTokenModel = require("./server/model/FCMTokenModel");
const serviceAccount = require("./notification.json");

// ✅ Initialize Firebase Admin FIRST
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Only log messaging AFTER initialization
console.log("Messaging():", admin.messaging());

// Schedule notification every minute
const startNotificationScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const tokenDocs = await FCMTokenModel.find({}, { token: 1, _id: 0 });
      const tokens = tokenDocs.map((doc) => doc.token);

      if (tokens.length === 0) {
        console.log("⚠️ No tokens found.");
        return;
      }

      const message = {
        notification: {
          title: "⏰ Scheduled Notification",
          body: "This is a test push sent every minute!",
        },
        tokens,
      };

      const response = await admin.messaging().sendMulticast(message);

      console.log(`✅ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`);
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
