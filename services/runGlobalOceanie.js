import { OCEANIA_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

export async function runGlobalOceanie() {
  try {
    const zones = [ ...(OCEANIA_ZONES || []) ];
    await addEngineLog(`🌊 Démarrage runGlobalOceanie (${zones.length})`, "info", "runOceanie");
    const result = await superForecast({ zones, runType: "Océanie" });
    await updateEngineState("ok", { engineStatus: "RUN_OK", lastFilter: "Océanie", zonesCount: zones.length });
    await addEngineLog(`✅ runGlobalOceanie terminé (${zones.length})`, "success", "runOceanie");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalOceanie : ${err.message}`, "runOceanie");
    return { error: err.message };
  }
}
