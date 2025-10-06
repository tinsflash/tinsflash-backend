// PATH: models/Alert.js
import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    // === Informations générales ===
    title: { type: String, required: true },                 // ex: "wind", "rain", etc.
    description: { type: String, required: true },           // message descriptif
    country: { type: String, required: true },               // code pays ou région
    region: { type: String, default: null },                 // ex: "Normandie", "California"
    continent: { type: String, default: null },              // ex: "Europe", "North America"
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
    altitude: { type: Number, default: 0 },

    // === Gravité & fiabilité ===
    severity: { type: String, enum: ["low","medium","high","extreme"], default: "medium" },
    certainty: { type: Number, min: 0, max: 100, required: true },
    trend: { type: String, enum: ["rising","falling","stable"], default: "rising" },
    workflow: {
      type: String,
      enum: ["published","toValidate","under-surveillance","archived","low-confidence"],
      default: "under-surveillance"
    },

    // === Métadonnées moteur ===
    source: { type: String, default: "TINSFLASH Nuclear Core" },
    runCount: { type: Number, default: 1 },
    lastRunId: { type: String, default: null },
    lastUpdate: { type: Date, default: Date.now },
    issuedAt: { type: Date, default: Date.now },

    // === Statut de découverte ===
    status: {
      type: String,
      enum: ["✅ Premier détecteur","⚠️ Déjà signalé","❌ Doublon"],
      default: "✅ Premier détecteur"
    },

    // === Historique d’évolution ===
    history: [
      {
        run: { type: Number },
        confidence: { type: Number },
        status: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],

    // === Validation manuelle ===
    validatedBy: { type: String, default: null },
    validatedAt: { type: Date, default: null },

    // === Liaison IA / externe ===
    external: {
      exclusivity: { type: String, enum: ["exclusive","confirmed-elsewhere","none"], default: "none" },
      references: { type: [String], default: [] }
    },
  },
  { timestamps: true }
);

// Indexation pour rapidité (filtrage par zone + statut)
AlertSchema.index({ country: 1, workflow: 1, certainty: -1 });
AlertSchema.index({ lat: 1, lon: 1 });

export default mongoose.model("Alert", AlertSchema);
