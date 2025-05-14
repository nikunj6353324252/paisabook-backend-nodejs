import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uploadImageBuffer from "../utils/uploadImageBuffer.js";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ======================== REGISTER ======================== //

const registerUser = async (req, res) => {
  try {
    const { mobile, email, password, confirmPassword } = req.body;

    if (!mobile || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "Mobile, email, and password are required",
      });
    }

    // If confirmPassword is present (from frontend), validate match
    if (confirmPassword && password !== confirmPassword) {
      return res
        .status(400)
        .json({ status: false, message: "Passwords do not match" });
    }

    // Check for existing mobile or email
    const [mobileExists, emailExists] = await Promise.all([
      User.findOne({ mobile }),
      User.findOne({ email }),
    ]);

    if (mobileExists) {
      return res
        .status(409)
        .json({ status: false, message: "Mobile number already registered" });
    }

    if (emailExists) {
      return res
        .status(409)
        .json({ status: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      mobile,
      email,
      password: hashedPassword,
      user_name: "",
      profile_image: "",
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      status: true,
      message: "Registration successful",
      user: {
        id: newUser._id,
        mobile: newUser.mobile,
        email: newUser.email,
        user_name: newUser.user_name,
        profile_image: newUser.profile_image,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};

// ======================== LOGIN ======================== //

const loginUser = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res
        .status(400)
        .json({ status: false, message: "Mobile and password are required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid mobile number or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid mobile number or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      status: true,
      message: "Login successful",
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email,
        user_name: user.user_name,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};

// ======================== GET USER PROFILE ======================== //

const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res
        .status(401)
        .json({ status: false, message: "User id is required field" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({
      status: true,
      message: "User profile retrieved successfully",
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email,
        user_name: user.user_name,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};

// ======================== UPDATE PROFILE ======================== //

// const updateUserProfile = async (req, res) => {
//   try {
//     const { id, email, user_name, profile_image } = req.body;

//     if (!id) {
//       return res
//         .status(400)
//         .json({ status: false, message: "User ID is required" });
//     }

//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Check email duplication
//     if (email && email !== user.email) {
//       const existingEmail = await User.findOne({ email });
//       if (existingEmail && existingEmail._id.toString() !== id) {
//         return res
//           .status(409)
//           .json({ status: false, message: "Email already in use" });
//       }
//       user.email = email;
//     }

//     // Check username duplication
//     if (user_name && user_name !== user.user_name) {
//       const existingUsername = await User.findOne({ user_name });
//       if (existingUsername && existingUsername._id.toString() !== id) {
//         return res
//           .status(409)
//           .json({ status: false, message: "Username already in use" });
//       }
//       user.user_name = user_name;
//     }

//     if (profile_image) {
//       user.profile_image = profile_image;
//     }

//     await user.save();

//     return res.status(200).json({
//       status: true,
//       message: "Profile updated successfully",
//       user: {
//         id: user._id,
//         email: user.email,
//         user_name: user.user_name,
//         profile_image: user.profile_image,
//       },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Server error", error: error.message });
//   }
// };

const updateUserProfile = async (req, res) => {
  try {
    const { id, email, user_name } = req.body;
    console.log("body", req.body);

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "User ID is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== id) {
        return res
          .status(409)
          .json({ status: false, message: "Email already in use" });
      }
      user.email = email;
    }

    if (user_name && user_name !== user.user_name) {
      const existingUsername = await User.findOne({ user_name });
      if (existingUsername && existingUsername._id.toString() !== id) {
        return res
          .status(409)
          .json({ status: false, message: "Username already in use" });
      }
      user.user_name = user_name;
    }

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      const uploadedUrl = await uploadImageBuffer(
        buffer,
        originalname,
        mimetype
      );
      user.profile_image = uploadedUrl;
    }

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        user_name: user.user_name,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};

export { registerUser, loginUser, getUserProfile, updateUserProfile };
