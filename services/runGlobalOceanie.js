// ==========================================================
// 🌊 TINSFLASH – runGlobalOceanie.js
// Everest Protocol v4.1 PRO+++ (100 % réel – Mongo + Phase 2 IA J.E.A.N. ready)
// ==========================================================

import { OCEANIA_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";
import { saveExtractionToMongo } from "./extractionStore.js"; // ✅ ajouté

export async function runGlobalOceanie() {
  try {
    await addEngineLog(
      `🌊 Démarrage runGlobalOceanie (${OCEANIA_ZONES?.length || 0} points)`,
      "info",
      "runOceanie"
    );

    // --- Étape 1 : Extraction réelle
    const zones = [...(OCEANIA_ZONES || [])];
    if (!zones.length) {
      await addEngineError("Aucune zone trouvée pour Océanie", "runOceanie");
      return { status: "fail", message: "No zones found" };
    }

    const result = await superForecast({ zones, runType: "Oceanie" });
    const timestamp = new Date().toISOString();

    // --- Étape 2 : Sauvegarde Mongo automatique
    await saveExtractionToMongo({
      zone: "Oceanie",
      data: result,
      timestamp,
    });

    // --- Étape 3 : Mise à jour du moteur
    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Oceanie",
      zonesCount: zones.length,
      savedAt: timestamp,
    });

    await addEngineLog(
      `✅ runGlobalOceanie terminé (${zones.length} zones, sauvegardé Mongo)`,
      "success",
      "runOceanie"
    );

    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalOceanie : ${err.message}`, "runOceanie");
    return { error: err.message };
  }
}

// ✅ Alias export pour compatibilité avec server.js
export { runGlobalOceanie as runOceanie };
