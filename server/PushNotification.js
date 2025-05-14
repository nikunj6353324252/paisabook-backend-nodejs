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
//   cron.schedule(
//     "0 * * * *",
//     async () => {
//       try {
//         const tokenDocs = await Token.find({}, { token: 1 });
//         const tokens = tokenDocs.map((doc) => doc.token);

//         if (tokens.length === 0) {
//           console.log("⚠️ No tokens found. Skipping notification.");
//           return;
//         }

//         const message = {
//           notification: {
//             title: "💰 Reminder",
//             body: "Don’t forget to add today’s expense!",
//           },
//         };

//         const response = await admin.messaging().sendEachForMulticast({
//           tokens,
//           ...message,
//         });

//         console.log(
//           `✅ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`
//         );

//         const invalidTokens = [];

//         response.responses.forEach((resp, idx) => {
//           if (!resp.success) {
//             console.error(
//               `❌ Token failed [${tokens[idx]}]:`,
//               resp.error.message
//             );
//             const errorCode = resp.error.code;

//             if (
//               errorCode === "messaging/registration-token-not-registered" ||
//               errorCode === "messaging/invalid-argument"
//             ) {
//               invalidTokens.push(tokens[idx]);
//             }
//           }
//         });

//         console.log("invalidTokens", invalidTokens);

//         if (invalidTokens.length > 0) {
//           await Token.deleteMany({ token: { $in: invalidTokens } });
//           console.log(
//             `🧹 Removed ${invalidTokens.length} invalid tokens from database.`
//           );
//         }
//       } catch (error) {
//         console.error("🔥 Notification Scheduler Error:", error);
//       }
//     },
//     {
//       timezone: "Asia/Kolkata", // ✅ This line is required to run at 5:30 PM IST
//     }
//   );
// };

// export default startNotificationScheduler;

import cron from "node-cron";
import { admin } from "./utils/firebaseAdmin.js";
import Token from "./model/FCMTokenModel.js";

const startNotificationScheduler = () => {
  cron.schedule(
    "0 * * * *",
    async () => {
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

        if (invalidTokens.length > 0) {
          await Token.deleteMany({ token: { $in: invalidTokens } });
          console.log(
            `🧹 Removed ${invalidTokens.length} invalid tokens from database.`
          );
        }
      } catch (error) {
        console.error("🔥 Notification Scheduler Error:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

export default startNotificationScheduler;

// ==> init firebase admin

// import admin from 'firebase-admin';
// import fs from 'fs';
// import path from 'path';

// const serviceAccount = JSON.parse(
//   fs.readFileSync(path.resolve('./notification.json'), 'utf8')
// );

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// export default admin;

// ==>  send notification api (node shedular message)

// import admin from './firebaseAdmin.js';
// import Token from '../models/FCMTokenModel.js';
// import dbConnect from './dbConnect.js'; // for mongoose

// const sendNotifications = async () => {
//   await dbConnect(); // connect to MongoDB

//   const tokenDocs = await Token.find({}, { token: 1 });
//   const tokens = tokenDocs.map(doc => doc.token);

//   if (tokens.length === 0) {
//     console.log("⚠️ No tokens found. Skipping notification.");
//     return { success: true, message: "No tokens to send" };
//   }

//   const message = {
//     notification: {
//       title: "💰 Reminder",
//       body: "Don’t forget to add today’s expense!",
//     },
//   };

//   const response = await admin.messaging().sendEachForMulticast({
//     tokens,
//     ...message,
//   });

//   const invalidTokens = [];

//   response.responses.forEach((resp, idx) => {
//     if (!resp.success) {
//       const errorCode = resp.error.code;
//       if (
//         errorCode === "messaging/registration-token-not-registered" ||
//         errorCode === "messaging/invalid-argument"
//       ) {
//         invalidTokens.push(tokens[idx]);
//       }
//     }
//   });

//   if (invalidTokens.length > 0) {
//     await Token.deleteMany({ token: { $in: invalidTokens } });
//   }

//   return {
//     success: true,
//     sent: response.successCount,
//     failed: response.failureCount,
//     removed: invalidTokens.length,
//   };
// };

// export default sendNotifications;

// ==> api code

// import sendNotifications from '../../utils/sendNotifications.js';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
//   }

//   try {
//     const result = await sendNotifications();
//     res.status(200).json({ status: 'success', ...result });
//   } catch (error) {
//     console.error('🔥 Notification API Error:', error);
//     res.status(500).json({ status: 'error', message: error.message });
//   }
// }
