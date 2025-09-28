// services/runGlobal.js
// ⚡ RUN GLOBAL – Zones couvertes (prévisions locales & nationales)

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import runSuperForecast from "./superForecast.js";   // ✅ import default
import { processAlerts } from "./alertsService.js";

export async function runGlobal() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Démarrage du RUN GLOBAL…");
    state.runTime = new Date().toISOString();
    state.checkup.models = "OK"; // 🟢 Modèles lancés
    saveEngineState(state);

    // Exemple Belgique + France (à étendre)
    const belgium = await runSuperForecast({ lat: 50.85, lon: 4.35, country: "Belgium" });
    const france  = await runSuperForecast({ lat: 48.85, lon: 2.35, country: "France" });

    state.zonesCovered = { belgium, france };
    state.checkup.localForecasts = "OK";
    state.checkup.nationalForecasts = "OK";
    saveEngineState(state);

    // Module alertes
    const alertsResult = await processAlerts();
    if (alertsResult.error) {
      state.checkup.aiAlerts = "FAIL"; // 🔴
      addEngineError(alertsResult.error);
    } else {
      state.checkup.aiAlerts = "OK";   // 🟢
    }
    saveEngineState(state);

    state.checkup.engineStatus = "OK";
    saveEngineState(state);
    addEngineLog("✅ RUN GLOBAL terminé avec succès");

    return { belgium, france, alertsResult };
  } catch (err) {
    state.checkup.engineStatus = "FAIL"; // 🔴
    saveEngineState(state);
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    addEngineLog("❌ RUN GLOBAL en échec");
    return { error: err.message };
  }
}
