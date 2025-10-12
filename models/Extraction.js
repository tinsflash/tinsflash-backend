// ==========================================================
// 📦 models/Extraction.js – Sauvegarde persistante des extractions
// ==========================================================
import mongoose from "mongoose";

const ExtractionSchema = new mongoose.Schema({
  label: { type: String, index: true },       // Ex: "Bouké", "Belgique"
  zones: { type: [String], default: [] },
  ts: { type: Date, default: Date.now, index: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Phase1Results complets
});

const Extraction = mongoose.model("Extraction", ExtractionSchema);
export default Extraction;
