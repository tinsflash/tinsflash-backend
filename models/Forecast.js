// -------------------------
// 📂 models/Forecast.js - Schéma Forecast
// -------------------------
import mongoose from "mongoose";

const ForecastSchema = new mongoose.Schema({
  runTime: String, // ex: "07h10", "12h10", "19h10"
  country: String,
  lat: Number,
  lon: Number,
  forecast: Object, // résultat fusionné
  errors: [String], // erreurs éventuelles des sources
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Forecast", ForecastSchema);
