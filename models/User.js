import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, // hashé avec bcrypt
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: { type: String, enum: ["free", "pro", "pro+", "premium"], default: "free" },
    country: { type: String, required: true }, // pour identifier si hors zone
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
