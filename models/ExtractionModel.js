// ==========================================================
// 🧠 TINSFLASH – ExtractionModel.js (Everest Protocol v4.4 PRO+++)
// Modèle MongoDB complet des extractions Phase 1
// ==========================================================

import mongoose from "mongoose";

// ----------------------------------------------------------
// Sous-schema des données de zone (détail par point)
const ZoneDataSchema = new mongoose.Schema(
  {
    zone: { type: String, required: false },
    country: { type: String, required: false },
    lat: { type: Number, required: false },
    lon: { type: Number, required: false },
    temperature: { type: Number, required: false },
    precipitation: { type: Number, required: false },
    wind: { type: Number, required: false },
    reliability: { type: Number, required: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ----------------------------------------------------------
// Schéma principal Extraction
const ExtractionSchema = new mongoose.Schema({
  runType: { type: String, required: true },            // ex. "Caribbean"
  zoneGroup: { type: String, default: "unknown" },      // ex. "NorthAmerica"
  timestamp: { type: Date, default: Date.now },         // date de sauvegarde
  zonesCount: { type: Number, default: 0 },             // nb de zones extraites
  data: { type: [ZoneDataSchema], default: [] },        // tableau des mesures
  status: { type: String, default: "done" },            // état de l’extraction
});

// ----------------------------------------------------------
export const ExtractionModel =
  mongoose.models.Extraction || mongoose.model("Extraction", ExtractionSchema);
