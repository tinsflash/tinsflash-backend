// models/Alerts.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true },
    status: { type: String, default: "active" },
    forecast: {
      temperature: { type: Number, default: 0 },
      precipitation: { type: Number, default: 0 },
      wind: { type: Number, default: 0 },
      description: { type: String, default: "Non défini" },
      anomaly: { type: String, default: "Normale" },
    },
    message: { type: String, required: true },
    radarImage: { type: String, default: "" },
    validationRequired: { type: Boolean, default: false },
    autoSend: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
