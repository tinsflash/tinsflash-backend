// models/Alert.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },       // pluie, neige, vent, chaleur...
    level: { type: String, required: true },      // vert, jaune, orange, rouge
    message: { type: String, required: true },    // texte explicatif
    reliability: { type: Number, default: null }, // % de fiabilité (70–100)
    location: {
      lat: { type: Number },
      lon: { type: Number },
      country: { type: String },
      city: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    validUntil: { type: Date } // date d’expiration de l’alerte
  },
  { collection: "alerts" }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
