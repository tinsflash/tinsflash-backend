// ==========================================================
// 🌊 TINSFLASH – runGlobalOceanie.js
// Everest Protocol v3.96 – Extraction Océanie (Australie, NZ, Pacifique Sud)
// ==========================================================

import { OCEANIA_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

export async function runGlobalOceanie() {
  try {
    const zones = [...(OCEANIA_ZONES || [])];

    await addEngineLog(
      `🌊 Démarrage runGlobalOceanie (${zones.length} points)`,
      "info",
      "runOceanie"
    );

    const result = await superForecast({ zones, runType: "Oceanie" });

    await updateEngineState("ok", {
      engineStatus: "RUN_OK",
      lastFilter: "Oceanie",
      zonesCount: zones.length,
    });

    await addEngineLog(
      `✅ runGlobalOceanie terminé (${zones.length} zones)`,
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
