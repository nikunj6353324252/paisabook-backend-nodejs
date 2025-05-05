import Token from "../model/FCMTokenModel.js";

// const saveToken = async (req, res) => {
//   const { user_id, token } = req.body;

//   if (!user_id || !token) {
//     return res.status(400).json({ message: "user_id and token are required." });
//   }

//   try {
//     const existing = await Token.findOne({ user_id });

//     if (existing) {
//       existing.token = token;
//       await existing.save();
//       return res
//         .status(200)
//         .json({ status: true, message: "Token updated successfully." });
//     }

//     await Token.create({ user_id, token });
//     return res
//       .status(201)
//       .json({ status: true, message: "Token saved successfully." });
//   } catch (error) {
//     console.error("Error saving token:", error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Internal server error." });
//   }
// };

const saveToken = async (req, res) => {
  const { user_id, token } = req.body;

  if (!user_id || !token) {
    return res.status(400).json({ message: "user_id and token are required." });
  }

  try {
    // Check if this token already exists for a different user
    const tokenConflict = await Token.findOne({ token });

    if (tokenConflict && tokenConflict.user_id !== user_id) {
      // Option 1: Reassign token to new user
      tokenConflict.user_id = user_id;
      await tokenConflict.save();
      return res.status(200).json({
        status: true,
        message: "Token reassigned to new user.",
      });

      // OR Option 2: Reject the request
      // return res.status(409).json({
      //   status: false,
      //   message: "This token is already assigned to another user.",
      // });
    }

    // Now check if user already has a token
    const existing = await Token.findOne({ user_id });

    if (existing) {
      existing.token = token;
      await existing.save();
      return res
        .status(200)
        .json({ status: true, message: "Token updated successfully." });
    }

    // Create new record
    await Token.create({ user_id, token });
    return res
      .status(201)
      .json({ status: true, message: "Token saved successfully." });
  } catch (error) {
    console.error("❌ Error saving token:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

const getAllTokens = async (req, res) => {
  try {
    const tokens = await Token.find({}, { token: 1, _id: 0 });
    const tokenList = tokens.map((item) => item.token);
    return res.status(200).json({ tokens: tokenList });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteToken = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required." });
  }

  try {
    const deleted = await Token.findOneAndDelete({ user_id });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Token not found for the given user." });
    }

    return res
      .status(200)
      .json({ status: true, message: "Token deleted successfully." });
  } catch (error) {
    console.error("Error deleting token:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

const getTokenByUserId = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required in params." });
  }

  try {
    const tokenDoc = await Token.findOne({ user_id });

    if (!tokenDoc) {
      return res
        .status(404)
        .json({ status: false, message: "No token found for the given user." });
    }

    return res.status(200).json({ status: true, token: tokenDoc.token });
  } catch (error) {
    console.error("Error fetching token by user ID:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

export { saveToken, getAllTokens, deleteToken, getTokenByUserId };
