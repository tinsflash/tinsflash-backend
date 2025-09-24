// models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "logs" }
);

const Log = mongoose.model("Log", logSchema);
export default Log;
