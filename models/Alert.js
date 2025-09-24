// models/Alert.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
    probability: { type: Number, required: true }, // ex: 85 (%)
    region: { type: String, required: true }, // ex: BE, FR, LUX, USA, etc.
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    source: { type: String, default: "Centrale Nucléaire Météo Tinsflash" },
    validated: { type: Boolean, default: false }, // >90% auto validé, 70-89% à valider
  },
  { collection: "alerts" }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
