// models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    country: { type: String, required: true }, // ex. "FR", "FR-NO", "USA-CA", "BE"
    severity: { type: String, enum: ["low","medium","high","extreme"], default: "medium" },
    certainty: { type: Number, min: 0, max: 100, required: true },
    issuedAt: { type: Date, default: Date.now },
    source: { type: String, default: "Tinsflash Nuclear Core" },
    status: {
      type: String,
      enum: ["✅ Premier détecteur","⚠️ Déjà signalé","❌ Doublon"],
      default: "✅ Premier détecteur"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Alert", AlertSchema);
