// models/Alert.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  type: { type: String, required: true },         // ex: "Pluie forte", "Tempête", "Inondation"
  description: { type: String, required: true },  // Détails explicatifs
  zone: { type: String, required: true },         // Localisation précise ou "Afrique", "Asie"...
  certainty: { type: Number, required: true },    // Pourcentage de certitude (0–100)
  severity: { type: String, enum: ["rouge", "orange", "jaune", "vert"], default: "jaune" }, // Classification
  source: { type: String, default: "Tinsflash AI" }, // Origine : IA, NASA, Trullemans...
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Alert", alertSchema);
