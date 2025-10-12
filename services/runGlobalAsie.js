// ==========================================================
// 🌍 TINSFLASH – runGlobalAsie.js
// Everest Protocol v3.95 – Extraction Asie (Est + Sud)
// ==========================================================

import { ASIA_EST_ZONES, ASIA_SUD_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

export async function runGlobalAsie() {
  try {
    const zones = [
      ...(ASIA_EST_ZONES || []),
      ...(ASIA_SUD_ZONES || []),
    ];

    await addEngineLog(`🌏 Démarrage runGlobalAsie (${zones.length} points)`, "info", "runAsie");
    const result = await superForecast({ zones, runType: "Asie" });

    await updateEngineState("ok", { engineStatus: "RUN_OK", lastFilter: "Asie", zonesCount: zones.length });
    await addEngineLog(`✅ runGlobalAsie terminé (${zones.length} zones)`, "success", "runAsie");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalAsie : ${err.message}`, "runAsie");
    return { error: err.message };
  }
}

// ✅ Alias export pour compatibilité server.js
export { runGlobalAsie as runAsie };
