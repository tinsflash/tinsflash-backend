// models/Forecast.js
import mongoose from "mongoose";

const ZoneSchema = new mongoose.Schema({
  name: String,
  min: Number,
  max: Number,
  icon: String,
  text: String
});

const ForecastSchema = new mongoose.Schema({
  country: String,
  zones: [ZoneSchema],
  text: String,
  icon: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Forecast", ForecastSchema);
