// services/forecastService.js
import { runSuperForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

export async function generateForecast(lat, lon, country, region) {
  try {
    const result = await runSuperForecast({ lat, lon, country, region });
    const state = await getEngineState();
    if (!state.forecasts) state.forecasts = [];
    state.forecasts.push(result.forecast);
    await saveEngineState(state);
    await addEngineLog(`✅ Prévision enregistrée ${country} ${region || ""}`);
    return result;
  } catch (err) {
    await addEngineError("Erreur forecastService: " + err.message);
    return { error: err.message };
  }
}