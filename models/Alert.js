// models/Alerts.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    zone: { type: String, required: true }, // ex. "FR-NO", "USA-CA"
    type: { type: String, default: "meteo" }, // ex. meteo, climatique
    message: { type: String, required: true }, // texte généré par IA
    confidence: { type: Number, default: 0 }, // % de certitude IA
    status: {
      type: String,
      enum: ["✅", "⚠️", "❌"],
      default: "⚠️", // par défaut en attente validation
    },
    source: { type: String, default: "JEAN" }, // toujours loggé
    published: { type: Boolean, default: false },
  },
  { timestamps: true } // createdAt, updatedAt
);

export default mongoose.model("Alert", AlertSchema);
