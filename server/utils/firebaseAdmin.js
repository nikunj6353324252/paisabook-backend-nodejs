// utils/firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.resolve("./notification.json");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "paisabook-4cb53.firebasestorage.app",
  });
}

const bucket = admin.storage().bucket();

export { admin, bucket };
