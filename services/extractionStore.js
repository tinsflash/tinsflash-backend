// ==========================================================
// 💾 TINSFLASH – extractionStore.js
// Gestion MongoDB des extractions Phase 1 (réel et global)
// Everest Protocol v4.0 PRO+++
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

const Extraction =
  mongoose.models.Extraction || mongoose.model("Extraction", ExtractionSchema);

// ==========================================================
// 💾 Enregistrement d’une extraction complète
// ==========================================================
export async function saveExtractionToMongo({ zone, filePath, data }) {
  try {
    if (!zone || !Array.isArray(data)) {
      throw new Error("Zone ou données invalides");
    }

    // 🧠 Si aucun chemin fourni, on crée un fichier automatiquement
    if (!filePath) {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      filePath = path.join(dataDir, `${zone.toLowerCase()}_${Date.now()}.json`);
    }

    // 🔄 Enregistre aussi en local pour sécurité (double sauvegarde)
    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    // 💾 Enregistrement ou mise à jour Mongo
    const existing = await Extraction.findOne({ zone });
    let doc;
    if (existing) {
      existing.timestamp = new Date();
      existing.filePath = filePath;
      existing.dataCount = data.length;
      existing.data = data;
      doc = await existing.save();
    } else {
      doc = await Extraction.create({
        zone,
        timestamp: new Date(),
        filePath,
        dataCount: data.length,
        data,
      });
    }

    await addEngineLog(
      `💾 Extraction Mongo enregistrée : ${zone} (${data.length} points)`,
      "info",
      "extraction"
    );

    // 🔗 Met à jour l’état moteur
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
// 📡 Lecture des extractions récentes (par zone ou globales)
// ==========================================================
export async function getRecentExtractions(hours = 2) {
  try {
    const cutoff = new Date(Date.now() - hours * 3600 * 1000);
    const data = await Extraction.find({ timestamp: { $gte: cutoff } }).sort({ timestamp: -1 });
    await addEngineLog(
      `📡 ${data.length} extractions récentes récupérées (<${hours}h)`,
      "info",
      "extraction"
    );
    return data;
  } catch (err) {
    await addEngineError(`Erreur getRecentExtractions : ${err.message}`, "extraction");
    return [];
  }
}

// ==========================================================
// 🌍 Lecture groupée par continent (IA J.E.A.N. & console admin)
// ==========================================================
export async function getLastExtractionsByContinent() {
  try {
    const all = await Extraction.find().sort({ timestamp: -1 });

    const grouped = {
      Europe: [],
      Afrique: [],
      AmeriqueNord: [],
      AmeriqueSud: [],
      Asie: [],
      Oceanie: [],
      Caraibes: [],
      Autres: [],
    };

    for (const doc of all) {
      const z = doc.zone.toLowerCase();
      if (z.includes("europe")) grouped.Europe.push(doc);
      else if (z.includes("afrique")) grouped.Afrique.push(doc);
      else if (z.includes("usa") || z.includes("canada") || z.includes("nord")) grouped.AmeriqueNord.push(doc);
      else if (z.includes("sud") || z.includes("amerique")) grouped.AmeriqueSud.push(doc);
      else if (z.includes("asie")) grouped.Asie.push(doc);
      else if (z.includes("oceanie")) grouped.Oceanie.push(doc);
      else if (z.includes("carib")) grouped.Caraibes.push(doc);
      else grouped.Autres.push(doc);
    }

    await addEngineLog("🌍 Regroupement des extractions par continent effectué", "info", "extraction");
    return grouped;
  } catch (err) {
    await addEngineError(`Erreur getLastExtractionsByContinent : ${err.message}`, "extraction");
    return {};
  }
}

// ==========================================================
// 🧩 Nettoyage ancien (optionnel pour maintenance future)
// ==========================================================
export async function cleanupOldExtractions(days = 7) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const res = await Extraction.deleteMany({ timestamp: { $lt: cutoff } });
    await addEngineLog(
      `🧹 ${res.deletedCount} anciennes extractions supprimées (> ${days} jours)`,
      "info",
      "extraction"
    );
  } catch (err) {
    await addEngineError(`Erreur cleanupOldExtractions : ${err.message}`, "extraction");
  }
}

// ==========================================================
// 📤 Exports
// ==========================================================
export default {
  saveExtractionToMongo,
  getRecentExtractions,
  getLastExtractionsByContinent,
  cleanupOldExtractions,
  Extraction,
};
