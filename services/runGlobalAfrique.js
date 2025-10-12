// ==========================================================
// 🌍 TINSFLASH – runGlobalAfrique.js
// Everest Protocol v3.95 – Extraction Afrique (Nord, Sud, Est, Ouest, Centrale)
// ==========================================================

import { AFRICA_NORD_ZONES, AFRICA_SUD_ZONES, AFRICA_EST_ZONES,
         AFRICA_OUEST_ZONES, AFRICA_CENTRALE_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

export async function runGlobalAfrique() {
  try {
    const zones = [
      ...(AFRICA_NORD_ZONES || []),
      ...(AFRICA_SUD_ZONES || []),
      ...(AFRICA_EST_ZONES || []),
      ...(AFRICA_OUEST_ZONES || []),
      ...(AFRICA_CENTRALE_ZONES || []),
    ];

    await addEngineLog(`🌍 Démarrage runGlobalAfrique (${zones.length} points)`, "info", "runAfrique");
    const result = await superForecast({ zones, runType: "Afrique" });

    await updateEngineState("ok", { engineStatus: "RUN_OK", lastFilter: "Afrique", zonesCount: zones.length });
    await addEngineLog(`✅ runGlobalAfrique terminé (${zones.length} zones)`, "success", "runAfrique");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalAfrique : ${err.message}`, "runAfrique");
    return { error: err.message };
  }
}

// ✅ Alias export pour compatibilité server.js
export { runGlobalAfrique as runAfrique };
