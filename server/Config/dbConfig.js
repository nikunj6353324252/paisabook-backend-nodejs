import mongoose from "mongoose";
import dotenv from "dotenv";  // Import dotenv

dotenv.config();  // Load environment variables from the .env file

mongoose.set("strictQuery", false);

const Database = process.env.MONGODB_URI;  // Access the environment variable
console.log("Database", Database);

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(Database);
    console.log(`Database connected : ${connection.connection.host}`);
  } catch (error) {
    console.log("error", error);
  }
};

export default connectDB;
