// ==========================================================
// 💾 TINSFLASH – saveExtractionToMongo.js (Everest Protocol v4.3 PRO+++)
// Sauvegarde Cloud + purge sélective des données >30 h
// ==========================================================

import { ExtractionModel } from "../models/ExtractionModel.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function saveExtractionToMongo(runType, zoneGroup, data) {
  try {
    if (!data || data.length === 0) {
      await addEngineError(`[MONGO] Données vides pour ${runType}`, "mongo");
      return false;
    }

    // 🧹 Étape 1 : écraser uniquement les anciennes extractions du même run
    await ExtractionModel.deleteMany({ runType });

    // 💾 Étape 2 : sauvegarder la nouvelle extraction
    const extraction = new ExtractionModel({
      runType,        // ex. "Bouke-Namur"
      zoneGroup,      // ex. "EU"
      timestamp: new Date(),
      zonesCount: data.length,
      data,
      status: "done",
    });

    await extraction.save();

    // ⏳ Étape 3 : purge sélective – supprimer uniquement les enregistrements
    // dont le timestamp est antérieur à 30 heures, tous runs confondus
    const cutoff = new Date(Date.now() - 30 * 60 * 60 * 1000);
    const deleted = await ExtractionModel.deleteMany({ timestamp: { $lt: cutoff } });

    await addEngineLog(
      `[MONGO] ✅ ${runType}/${zoneGroup} sauvegardé (${data.length} zones). ` +
      `Purge sélective : ${deleted.deletedCount} anciens documents (>30 h) supprimés.`,
      "info",
      "mongo"
    );

    return true;
  } catch (err) {
    await addEngineError(
      `[MONGO] ❌ Échec sauvegarde ${runType} : ${err.message}`,
      "mongo"
    );
    return false;
  }
}
