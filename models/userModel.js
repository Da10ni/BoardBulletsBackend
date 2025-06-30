import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "student"],
    required: true,
    default: "student",
  },
  profile: {
    profilePic: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    DOB: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
      default: "male",
    },
  },
});

export const userModel =
  mongoose.models.Users || mongoose.model("User", userSchema);
