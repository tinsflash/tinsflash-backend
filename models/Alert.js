// models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  zone: { type: String, default: "Unknown" },
  certainty: { type: Number, default: 50 }, // taux IA
  modelsUsed: { type: [String], default: [] },
  firstDetection: { type: Date, default: Date.now },
  lastCheck: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["under_watch", "validated", "auto_published", "archived"],
    default: "under_watch",
  },
  validationState: { type: String, default: "pending" },
  exported: { type: Boolean, default: false },
  geo: {
    lat: Number,
    lon: Number,
  },
  sources: { type: [String], default: [] },
  history: [
    {
      ts: { type: Date, default: Date.now },
      note: String,
    },
  ],
});

export default mongoose.model("Alert", AlertSchema);
