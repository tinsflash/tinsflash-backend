// ==========================================================
// 💾 TINSFLASH – saveExtractionToMongo.js (Everest Protocol v4.0 PRO+++)
// Sauvegarde des extractions météo réelles dans MongoDB (Cloud)
// ==========================================================

import { ExtractionModel } from "../models/ExtractionModel.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function saveExtractionToMongo(runType, data) {
  try {
    if (!data || data.length === 0) {
      await addEngineError(`[MONGO] Données vides pour ${runType}`, "mongo");
      return false;
    }

    const extraction = new ExtractionModel({
      runType,
      timestamp: new Date(),
      zonesCount: data.length,
      data,
    });

    await extraction.save();

    await addEngineLog(
      `[MONGO] ✅ Extraction ${runType} sauvegardée (${data.length} zones)`,
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
