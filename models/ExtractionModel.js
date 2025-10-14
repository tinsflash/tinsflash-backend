// ==========================================================
// 🧠 TINSFLASH – ExtractionModel.js (Everest Protocol v4.0 PRO+++)
// Modèle MongoDB des extractions Phase 1
// ==========================================================

import mongoose from "mongoose";

const ExtractionSchema = new mongoose.Schema({
  runType: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  zonesCount: { type: Number, default: 0 },
  data: { type: Array, default: [] },
});

export const ExtractionModel =
  mongoose.models.Extraction || mongoose.model("Extraction", ExtractionSchema);
