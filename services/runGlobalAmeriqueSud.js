import { AMERICA_SUD_ZONES, CARIBBEAN_ZONES } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

export async function runGlobalAmeriqueSud() {
  try {
    const zones = [ ...(AMERICA_SUD_ZONES || []), ...(CARIBBEAN_ZONES || []) ];
    await addEngineLog(`🌎 Démarrage runGlobalAmeriqueSud (${zones.length})`, "info", "runAmeriqueSud");
    const result = await superForecast({ zones, runType: "AmériqueSud" });
    await updateEngineState("ok", { engineStatus: "RUN_OK", lastFilter: "AmériqueSud", zonesCount: zones.length });
    await addEngineLog(`✅ runGlobalAmeriqueSud terminé (${zones.length})`, "success", "runAmeriqueSud");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobalAmeriqueSud : ${err.message}`, "runAmeriqueSud");
    return { error: err.message };
  }
}
