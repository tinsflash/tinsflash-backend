// PATH: models/Alert.js
// 🌍 Modèle Mongoose des alertes TINSFLASH
// 100 % réel – utilisé par runGlobal, alertsService et la console admin

import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  zone: { type: String, default: "Unknown" },
  certainty: { type: Number, default: 50 }, // taux de fiabilité IA
  modelsUsed: { type: [String], default: [] }, // GFS, ECMWF, ICON, etc.
  firstDetection: { type: Date, default: Date.now },
  lastCheck: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["under_watch", "validated", "auto_published", "archived"],
    default: "under_watch",
  },
  validationState: { type: String, default: "pending" },
  exported: { type: Boolean, default: false },
  geo: {
    lat: Number,
    lon: Number,
  },
  sources: { type: [String], default: [] }, // Ex: MeteoAlarm, NWS, Copernicus
  history: [
    {
      ts: { type: Date, default: Date.now },
      note: String,
    },
  ],
});

// 🚀 Index géographique (accélère les requêtes cartographiques)
AlertSchema.index({ "geo.lat": 1, "geo.lon": 1 });

// 🕒 Index temporel (accélère les recherches / nettoyages récents)
AlertSchema.index({ lastCheck: -1 });

// ✅ Export du modèle
export default mongoose.model("Alert", AlertSchema);
