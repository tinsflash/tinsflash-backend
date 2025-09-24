// models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },         // ex. "Tempête violente"
    description: { type: String, required: true },   // détail de l'alerte
    country: { type: String, required: true },       // ex. "FR", "USA-CA"
    severity: { type: String, enum: ["low", "medium", "high", "extreme"], default: "medium" },
    certainty: { type: Number, min: 0, max: 100, required: true }, // % de certitude
    issuedAt: { type: Date, default: Date.now },     // horodatage alerte
    source: { type: String, default: "Tinsflash Nuclear Core" },   // toujours clair 🚀
    status: { type: String, enum: ["✅ Premier détecteur", "⚠️ Déjà signalé", "❌ Doublon"], default: "✅ Premier détecteur" }
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", AlertSchema);
export default Alert;
