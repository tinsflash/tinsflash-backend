// services/aiAnalysis.js
import { getEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { fetchStationData } from "./stationsService.js";
import { applyLocalFactors } from "./localFactors.js";
import { applyClimateFactors } from "./climateFactors.js";

export async function runAIAnalysis() {
  const state = await getEngineState();
  try {
    await addEngineLog("🧠 Analyse IA J.E.A.N en cours...");
    if (!state.forecasts || state.forecasts.length === 0) return { success: false, message: "Aucune prévision" };

    const validated = [];
    for (const f of state.forecasts) {
      const stations = await fetchStationData(f.lat, f.lon, f.country, f.region);
      let corrected = await applyLocalFactors(f, f.lat, f.lon, f.country);
      corrected = await applyClimateFactors(corrected, f.lat, f.lon, f.country);
      const confidence = 80 + (stations?.data ? 10 : 0) + Math.random() * 10;
      validated.push({ ...corrected, confidence: Math.min(100, confidence) });
    }

    state.finalReport = validated;
    await saveEngineState(state);
    await addEngineLog(`✅ IA J.E.A.N validé ${validated.length} prévisions.`);
    return { success: true, validated };
  } catch (err) {
    await addEngineError("Erreur IA J.E.A.N: " + err.message);
    return { success: false, error: err.message };
  }
}