// import admin from "firebase-admin";
// import cron from "node-cron";
// import Token from "./model/FCMTokenModel.js";
// import fs from "fs";
// import path from "path";

// const serviceAccount = JSON.parse(
//   fs.readFileSync(path.resolve("./notification.json"), "utf8")
// );

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const startNotificationScheduler = () => {
//   cron.schedule("* * * * *", async () => {
//     try {
//       const tokenDocs = await Token.find({}, { token: 1, _id: 0 });
//       const tokens = tokenDocs.map((doc) => doc.token);

//       if (tokens.length === 0) {
//         console.log("⚠️ No tokens found.");
//         return;
//       }

//       const message = {
//         notification: {
//           title: "💰 Reminder",
//           body: "Don’t forget to add today’s expense!",
//         },
//         tokens,
//       };

//       const response = await admin.messaging().sendEachForMulticast(message);

//       console.log(
//         `✅ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`
//       );
//       response.responses.forEach((resp, idx) => {
//         if (!resp.success) {
//           console.error(`Token ${tokens[idx]} failed:`, resp.error);
//         }
//       });
//     } catch (error) {
//       console.error("🔥 Notification error:", error.message);
//     }
//   });
// };

// export default startNotificationScheduler;

import admin from "firebase-admin";
import cron from "node-cron";
import Token from "./model/FCMTokenModel.js";
import fs from "fs";
import path from "path";

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve("./notification.json"), "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const startNotificationScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const tokenDocs = await Token.find({}, { token: 1 });
      const tokens = tokenDocs.map((doc) => doc.token);

      if (tokens.length === 0) {
        console.log("⚠️ No tokens found. Skipping notification.");
        return;
      }

      const message = {
        notification: {
          title: "💰 Reminder",
          body: "Don’t forget to add today’s expense!",
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });

      console.log(
        `✅ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`
      );

      const invalidTokens = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `❌ Token failed [${tokens[idx]}]:`,
            resp.error.message
          );
          const errorCode = resp.error.code;

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-argument"
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      console.log("invalidTokens", invalidTokens);

      if (invalidTokens.length > 0) {
        await Token.deleteMany({ token: { $in: invalidTokens } });
        console.log(
          `🧹 Removed ${invalidTokens.length} invalid tokens from database.`
        );
      }
    } catch (error) {
      console.error("🔥 Notification Scheduler Error:", error);
    }
  });
};

export default startNotificationScheduler;
