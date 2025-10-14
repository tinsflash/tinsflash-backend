// ====================================================================
// FICHIER : /vision/storeCapture.js
// ====================================================================
// 💾 VisionIA – Sauvegarde des captures dans MongoDB
// ====================================================================

import mongoose from "mongoose";

const VisionSchema = new mongoose.Schema({
  source: String,
  file: String,
  date: String,
  timestamp: { type: Date, default: Date.now }
});

const VisionCapture =
  mongoose.models.VisionCapture || mongoose.model("VisionCapture", VisionSchema);

export async function storeCapture(captures = []) {
  const stored = [];
  for (const c of captures) {
    try {
      await VisionCapture.create(c);
      stored.push(c);
    } catch (err) {
      console.error(`⚠️ Erreur sauvegarde capture ${c.source} : ${err.message}`);
    }
  }
  return stored;
}
