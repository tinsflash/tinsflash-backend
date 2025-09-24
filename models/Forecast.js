// models/Forecast.js
import mongoose from "mongoose";

const forecastSchema = new mongoose.Schema(
  {
    country: { type: String, required: true }, // BE, FR, LUX, USA
    date: { type: String, required: true }, // format YYYY-MM-DD
    minTemp: { type: Number, required: true },
    maxTemp: { type: Number, required: true },
    windSpeed: { type: Number },
    rainProbability: { type: Number },
    summary: { type: String }, // tendance générale de la journée
    icon: { type: String }, // soleil, pluie, neige, orage, etc.
    createdAt: { type: Date, default: Date.now },
    source: { type: String, default: "Centrale Nucléaire Météo Tinsflash" },
  },
  { collection: "forecasts" }
);

const Forecast = mongoose.model("Forecast", forecastSchema);

export default Forecast;
