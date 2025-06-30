import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    if (db) {
      console.log("database connected successfully");
    }
  } catch (error) {
    console.log(error.message);
  }
};

export default connectDB
