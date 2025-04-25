const FCMTokenModel = require("../model/FCMTokenModel");

const saveToken = async (req, res) => {
  const { user_id, token } = req.body;

  if (!user_id || !token) {
    return res.status(400).json({ message: "user_id and token are required." });
  }

  try {
    const existing = await FCMTokenModel.findOne({ user_id });

    if (existing) {
      existing.token = token;
      await existing.save();
      return res.status(200).json({ message: "Token updated successfully." });
    }

    await FCMTokenModel.create({ user_id, token });
    return res.status(201).json({ message: "Token saved successfully." });
  } catch (error) {
    console.error("Error saving token:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getAllTokens = async (req, res) => {
  try {
    const tokens = await FCMTokenModel.find({}, { token: 1, _id: 0 });
    const tokenList = tokens.map((item) => item.token);
    return res.status(200).json({ tokens: tokenList });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  saveToken,
  getAllTokens,
};
