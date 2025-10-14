// ==========================================================
// 💾 TINSFLASH – saveExtractionToMongo.js (Everest Protocol v4.4 PRO+++)
// Sauvegarde Cloud + validation stricte + purge sélective des données >30 h
// ==========================================================

import { ExtractionModel } from "../models/ExtractionModel.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function saveExtractionToMongo(runType, zoneGroup, data) {
  try {
    // ✅ Étape 0 – Validation basique
    if (!data || !Array.isArray(data) || data.length === 0) {
      await addEngineError(`[MONGO] Données vides ou invalides pour ${runType}`, "mongo");
      return false;
    }

    // ✅ Étape 1 – Vérification / correction des champs manquants
    const now = new Date();
    const cleaned = data.map((z, i) => {
      return {
        zone: z.zone || z.region || z.country || `${runType}_Z${i + 1}`,
        country: z.country || "unknown",
        lat: z.lat ?? null,
        lon: z.lon ?? null,
        reliability: z.reliability ?? null,
        timestamp: z.timestamp || now,
        ...z,
      };
    });

    // 🧹 Étape 2 – Supprimer uniquement les anciennes extractions du même run
    await ExtractionModel.deleteMany({ runType });

    // 💾 Étape 3 – Sauvegarder la nouvelle extraction
    const extraction = new ExtractionModel({
      runType,              // ex. "Bouke-Namur"
      zoneGroup: zoneGroup || "unknown",
      timestamp: now,
      zonesCount: cleaned.length,
      data: cleaned,
      status: "done",
    });

    await extraction.save();

    // ⏳ Étape 4 – Purge sélective : supprimer les enregistrements de plus de 30 h
    const cutoff = new Date(Date.now() - 30 * 60 * 60 * 1000);
    const deleted = await ExtractionModel.deleteMany({ timestamp: { $lt: cutoff } });

    await addEngineLog(
      `[MONGO] ✅ ${runType}/${zoneGroup || "?"} sauvegardé (${cleaned.length} zones). `
        + `Purge : ${deleted.deletedCount} anciens (> 30 h) supprimés.`,
      "info",
      "mongo"
    );

    return true;
  } catch (err) {
    await addEngineError(`[MONGO] ❌ Échec sauvegarde ${runType} : ${err.message}`, "mongo");
    return false;
  }
}
