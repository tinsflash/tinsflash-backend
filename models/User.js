// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["free", "premium", "pro", "pro+"],
      default: "free"
    },
    zone: {
      type: String,
      enum: [
        "Europe",
        "USA",
        "Afrique",
        "Asie",
        "Océanie",
        "Amérique du Sud",
        "Autre"
      ],
      required: true
    },
    subscription: {
      type: String,
      enum: ["monthly", "annual", "none"],
      default: "none"
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index pour améliorer les recherches par zone et rôle
UserSchema.index({ role: 1, zone: 1 });

export default mongoose.model("User", UserSchema);
