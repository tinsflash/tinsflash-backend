// models/Alert.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true },
    reliability: { type: Number, default: 0 },
    status: { type: String },
    forecast: {
      temperature: Number,
      precipitation: Number,
      wind: Number,
      description: String,
      anomaly: String,
    },
    message: { type: String, required: true },
    radarImage: { type: String },
    validationRequired: { type: Boolean, default: false },
    autoSend: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
