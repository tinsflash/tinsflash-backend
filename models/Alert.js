// models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  type: { type: String, required: true }, // pluie, vent, neige, etc.
  severity: { type: String, enum: ["jaune", "orange", "rouge"], required: true },
  confidence: { type: Number, required: true }, // pourcentage de certitude
  description: { type: String },
  issuedAt: { type: Date, default: Date.now },
  validUntil: { type: Date },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    city: { type: String },
    country: { type: String }
  },
  source: { type: String, default: "Tinsflash AI" },
  validated: { type: Boolean, default: false } // validé manuellement si entre 70 et 90%
});

export default mongoose.model("Alert", AlertSchema);
