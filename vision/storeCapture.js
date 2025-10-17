// ====================================================================
// FICHIER : /vision/storeCapture.js
// ====================================================================
// 💾 VisionIA – Sauvegarde des captures dans MongoDB
// 🔧 Version : TINSFLASH PRO+++ v6.3 (NOAA / GOES compatible)
// ====================================================================

import mongoose from "mongoose";
import { addVisionLog } from "./logVisionCapture.js";

// ====================================================================
// 🧱 Schéma Mongoose VisionCapture
// ====================================================================
const VisionSchema = new mongoose.Schema({
  source: { type: String, required: true },
  file: { type: String },
  date: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const VisionCapture =
  mongoose.models.VisionCapture || mongoose.model("VisionCapture", VisionSchema);

// ====================================================================
// 💾 Sauvegarde des captures dans MongoDB
// ====================================================================
export async function storeCapture(captures = []) {
  const stored = [];

  if (!Array.isArray(captures) || captures.length === 0) {
    await addVisionLog("⚠️ Aucune capture à stocker dans MongoDB", "warn");
    return stored;
  }

  for (const c of captures) {
    try {
      await VisionCapture.create(c);
      stored.push(c);
      await addVisionLog(`💾 Capture enregistrée : ${c.source}`, "info");
    } catch (err) {
      console.error(`⚠️ Erreur sauvegarde capture ${c.source} : ${err.message}`);
      await addVisionLog(
        `⚠️ Erreur MongoDB lors de la sauvegarde de ${c.source} : ${err.message}`,
        "error"
      );
    }
  }

  await addVisionLog(`✅ ${stored.length}/${captures.length} captures stockées dans MongoDB`, "success");
  return stored;
}
