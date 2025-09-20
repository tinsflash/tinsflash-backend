// models/Forecast.js
import mongoose from "mongoose";

const forecastSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    temperature_min: { type: Number, default: 0 },
    temperature_max: { type: Number, default: 0 },
    wind: { type: Number, default: 0 },
    precipitation: { type: Number, default: 0 },
    description: { type: String, default: "Non défini" },
    anomaly: { type: String, default: "Normale" },
    reliability: { type: Number, default: 0 },
    aiSummary: { type: String, default: "" },
    runAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Forecast = mongoose.model("Forecast", forecastSchema);
export default Forecast;
