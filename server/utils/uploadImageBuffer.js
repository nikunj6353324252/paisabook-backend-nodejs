import { bucket } from "../utils/firebaseAdmin.js";

const uploadImageBuffer = async (buffer, filename, mimetype) => {
  const file = bucket.file(`images/${filename}`);
  const stream = file.createWriteStream({
    metadata: {
      contentType: mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.on("finish", async () => {
      await file.makePublic(); // optional
      resolve(
        `https://storage.googleapis.com/${bucket.name}/images/${filename}`
      );
    });

    stream.end(buffer);
  });
};

export default uploadImageBuffer;
