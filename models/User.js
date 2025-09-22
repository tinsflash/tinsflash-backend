// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["free", "premium", "pro", "proPlus"], 
    default: "free" 
  },
  zone: { 
    type: String, 
    enum: ["covered", "nonCovered"], 
    default: "nonCovered" 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
