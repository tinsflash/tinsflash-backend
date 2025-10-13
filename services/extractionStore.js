// ==========================================================
// 💾 TINSFLASH – extractionStore.js
// Gestion MongoDB des extractions Phase 1 (réel et global)
// ==========================================================

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError, setLastExtraction } from "./engineState.js";

// ==========================================================
// 🧩 Schéma MongoDB pour les extractions Phase 1
// ==========================================================
const ExtractionSchema = new mongoose.Schema({
  zone: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  filePath: { type: String, default: "" },
  dataCount: { type: Number, default: 0 },
  data: { type: Array, default: [] },
});

export const Extraction = mongoose.model("Extraction", ExtractionSchema);

// ==========================================================
// 💾 Enregistrement d’une extraction complète
// ==========================================================
export async function saveExtractionToMongo({ zone, filePath, data }) {
  try {
    if (!zone || !Array.isArray(data)) throw new Error("Zone ou données invalides");

    // 🧠 Auto-génération d’un chemin si absent
    if (!filePath) {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      filePath = path.join(dataDir, `${zone.toLowerCase()}_${Date.now()}.json`);
    }

    // 🔄 Enregistrement local
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    // 💾 Mongo : création ou mise à jour
    const existing = await Extraction.findOne({ zone });
    const doc = existing
      ? Object.assign(existing, {
          timestamp: new Date(),
          filePath,
          dataCount: data.length,
          data,
        })
      : new Extraction({ zone, timestamp: new Date(), filePath, dataCount: data.length, data });

    await doc.save();

    await addEngineLog(`💾 Extraction Mongo enregistrée : ${zone} (${data.length} points)`, "info", "extraction");

    // 🔗 Moteur
    await setLastExtraction({
      id: doc._id,
      zones: [zone],
      files: [filePath],
      ts: new Date(),
      status: "done",
    });

    return { success: true, zone, count: data.length, mongoId: doc._id, filePath };
  } catch (err) {
    await addEngineError(`Erreur saveExtractionToMongo : ${err.message}`, "extraction");
    return { success: false, error: err.message };
  }
}

// ==========================================================
// 📡 Lecture des extractions récentes
// ==========================================================
export async function getRecentExtractions(hours = 2) {
  try {
    const cutoff = new Date(Date.now() - hours * 3600 * 1000);
    const data = await Extraction.find({ timestamp: { $gte: cutoff } }).sort({ timestamp: -1 });
    await addEngineLog(`📡 ${data.length} extractions récentes récupérées (<${hours}h)`, "info", "extraction");
    return data;
  } catch (err) {
    await addEngineError(`Erreur getRecentExtractions : ${err.message}`, "extraction");
    return [];
  }
}

// ==========================================================
// 🧩 Nettoyage ancien
// ==========================================================
export async function cleanupOldExtractions(days = 7) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const res = await Extraction.deleteMany({ timestamp: { $lt: cutoff } });
    await addEngineLog(`🧹 ${res.deletedCount} anciennes extractions supprimées (> ${days} jours)`, "info", "extraction");
  } catch (err) {
    await addEngineError(`Erreur cleanupOldExtractions : ${err.message}`, "extraction");
  }
}

// ==========================================================
// 📤 Export
// ==========================================================
export default {
  saveExtractionToMongo,
  getRecentExtractions,
  cleanupOldExtractions,
  Extraction,
};
