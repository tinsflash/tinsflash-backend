// ==========================================================
// 🌍 TINSFLASH – runGlobalAmeriqueSud.js
// Everest Protocol v3.95 – Extraction Amérique du Sud
// ==========================================================

import { AMERICA_SUD_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

export async function runGlobalAmeriqueSud() {
  try {
    const zones = [...(AMERICA_SUD_ZONES || [])];

    await addEngineLog(`🌎 Démarrage runGlobalAmeriqueSud (${zones.length} points)`, "info", "runAmeriqueSud");
    const result = await superForecast({ zones, runType: "AmériqueSud" });

    await updateEngineState("ok", { engineStatus: "RUN_OK", lastFilter: "AmériqueSud", zonesCount: zones.length });
    await addEngineLog(`✅ runGlobalAmeriqueSud terminé (${zones.length} zones)`, "success", "runAmeriqueSud");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalAmeriqueSud : ${err.message}`, "runAmeriqueSud");
    return { error: err.message };
  }
}

// ✅ Alias export pour compatibilité server.js
export { runGlobalAmeriqueSud as runAmeriqueSud };
