const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const Database = process.env.MONGODB_URI;
console.log("Database", Database);

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(Database);
    console.log(`Database connected : ${connection.connection.host}`);
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = connectDB;
