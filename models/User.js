// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Free", "Premium", "Pro", "Pro+"], required: true },
    zone: { type: String, enum: ["covered", "non-covered"], required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

const User = mongoose.model("User", userSchema);
export default User;
