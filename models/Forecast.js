// models/Forecast.js
import mongoose from "mongoose";

const forecastSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true }, // timestamp du run

    forecast: {
      temperature: { type: Number, required: false },
      precipitation: { type: Number, required: false },
      wind: { type: Number, required: false },
      description: { type: String, required: false }
    },

    source: { type: String, required: true },       // modèle météo dominant
    reliability: { type: Number, default: null },   // score 0–100
    anomaly: { type: String, default: null },       // "au-dessus saison", etc.
    elevation: { type: Number, default: null },     // m
    location: {
      lat: { type: Number },
      lon: { type: Number },
      country: { type: String },
      city: { type: String }
    },

    createdAt: { type: Date, default: Date.now }
  },
  { collection: "forecasts" }
);

const Forecast = mongoose.model("Forecast", forecastSchema);
export default Forecast;
