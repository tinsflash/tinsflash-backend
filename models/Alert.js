// models/Alerts.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    zone: { type: String, required: true }, // ex. "FR-NO", "USA-CA", "BE"
    type: { type: String, default: "meteo" }, // météo, climatique, etc.
    message: { type: String, required: true }, // texte généré par J.E.A.N.
    confidence: { type: Number, default: 0 }, // certitude % (IA)
    status: {
      type: String,
      enum: ["✅", "⚠️", "❌"],
      default: "⚠️", // par défaut → en attente
    },
    source: { type: String, default: "JEAN" }, // ex. JEAN, NOAA, Copernicus
    published: { type: Boolean, default: false }, // publié ou pas
  },
  { timestamps: true } // ajoute createdAt et updatedAt
);

export default mongoose.model("Alert", AlertSchema);
