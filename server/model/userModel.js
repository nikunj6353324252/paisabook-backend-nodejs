import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  user_name: {
    type: String,
    required: false,
  },
  profile_image: {
    type: String,
    required: false,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
