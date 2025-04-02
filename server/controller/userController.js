const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");

// REGISTER
const registerUser = async (req, res) => {
  const { mobile, email, password, confirmPassword } = req.body;

  if (!mobile || !email || !password || !confirmPassword) {
    return res
      .status(400)
      .json({ status: false, message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ status: false, message: "Passwords do not match" });
  }

  const mobileExists = await userModel.findOne({ mobile });
  if (mobileExists) {
    return res
      .status(409)
      .json({ status: false, message: "Mobile number already registered" });
  }

  const emailExists = await userModel.findOne({ email });
  if (emailExists) {
    return res
      .status(409)
      .json({ status: false, message: "email already registered" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      mobile,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res
      .status(201)
      .json({ status: true, message: "Registration successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Server error", error });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res
      .status(400)
      .json({ status: false, message: "Mobile and password are required" });
  }

  try {
    const user = await userModel.findOne({ mobile });
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid mobile number or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid mobile number or password" });
    }

    return res.status(200).json({
      status: true,
      message: "Login successful",
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Server error", error });
  }
};

const updateUserProfile = async (req, res) => {
  const { id, email, username } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ status: false, message: "User ID is required" });
  }

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Check if email already exists for another user
    if (email && email !== user.email) {
      const existingEmail = await userModel.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== id) {
        return res
          .status(409)
          .json({ status: false, message: "Email already in use" });
      }
      user.email = email;
    }

    // Check if username already exists for another user
    if (username && username !== user.username) {
      const existingUsername = await userModel.findOne({ username });
      if (existingUsername && existingUsername._id.toString() !== id) {
        return res
          .status(409)
          .json({ status: false, message: "Username already in use" });
      }
      user.username = username;
    }

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
};
