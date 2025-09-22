// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["free", "premium", "pro", "pro+"],
      default: "free",
    },
    zone: {
      type: String,
      enum: [
        "Europe",
        "USA",
        "Canada",
        "Groenland",
        "Afrique",
        "Asie",
        "Océanie",
        "Amérique du Sud",
        "Hors zone",
      ],
      default: "Europe",
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
