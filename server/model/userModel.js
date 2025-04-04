// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   mobile: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   user_name: { type: String, required: false, sparse: true },
//   profile_image: { type: String, required: false, sparse: true },
// });

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

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

module.exports = mongoose.model("User", userSchema);
