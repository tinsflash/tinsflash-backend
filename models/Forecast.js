// models/Forecast.js
import mongoose from "mongoose";

const ForecastSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    city: { type: String },
    country: { type: String }
  },
  data: mongoose.Schema.Types.Mixed, // les prévisions fusionnées
  sources: [String], // liste des modèles utilisés
  anomaly: mongoose.Schema.Types.Mixed // anomalies saisonnières détectées
});

export default mongoose.model("Forecast", ForecastSchema);
