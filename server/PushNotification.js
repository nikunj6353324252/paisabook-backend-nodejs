// import admin from "firebase-admin";
// import cron from "node-cron";
// import FCMTokenModel from "./model/FCMTokenModel.js";
// import serviceAccount from "../notification.json" assert { type: "json" };

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const startNotificationScheduler = () => {
//   cron.schedule("0 22 * * *", async () => {
//     try {
//       const tokenDocs = await FCMTokenModel.find({}, { token: 1, _id: 0 });
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

// Manually read the JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve("./notification.json"), "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const startNotificationScheduler = () => {
  cron.schedule("0 22 * * *", async () => {
    try {
      const tokenDocs = await Token.find({}, { token: 1, _id: 0 });
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

export default startNotificationScheduler;
