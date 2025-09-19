// -------------------------
// 📊 models/Forecast.js
// Schéma MongoDB pour sauvegarder les runs météo
// -------------------------
import mongoose from "mongoose";

const ForecastSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
    },
    forecast: {
      temperature: Number,
      temperature_min: Number,
      temperature_max: Number,
      wind: Number,
      precipitation: Number,
      description: String,
      reliability: Number,
      anomaly: Object,
      sources: [String],
      bulletin: String,
    },
    errors: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      default: "⏳ En attente",
    },
  },
  { timestamps: true } // createdAt, updatedAt automatiques
);

const Forecast = mongoose.model("Forecast", ForecastSchema);

export default Forecast;
