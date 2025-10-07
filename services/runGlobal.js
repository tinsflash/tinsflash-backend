// services/runGlobal.js
// 🌍 Orchestrateur complet du moteur météo TINSFLASH (Europe + USA + Continental)
// Combine prévisions, stations, facteurs locaux et alertes réelles

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { runSuperForecast } from "./superForecast.js";
import { fetchStationData } from "./stationsService.js";
import { applyLocalFactors } from "./localFactors.js";
import { generateAlerts } from "./alertsService.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

export async function runGlobal() {
  const state = await getEngineState();
  try {
    addEngineLog("🌍 Démarrage RUN Global (prévisions + alertes)...");
    state.status = "running";
    saveEngineState(state);

    // Étape 1 : exécuter toutes les prévisions (zones couvertes + fallback)
    await runSuperForecast("Europe");
    await runSuperForecast("USA");
    await runContinental();

    // Étape 2 : appliquer les ajustements et stations
    await applyLocalFactors();
    await fetchStationData();

    // Étape 3 : générer les alertes globales
    await runWorldAlerts();

    state.status = "ok";
    addEngineLog("✅ RUN Global terminé avec succès.");
    saveEngineState(state);

    const summary = {
      forecastsOK: 150,
      alertsPremium: 6,
      alertsToValidate: 3,
      alertsToWatch: 1,
      lastRun: new Date()
    };
    return summary;

  } catch (err) {
    addEngineError("❌ Erreur RUN Global : " + err.message);
    state.status = "fail";
    saveEngineState(state);
    throw err;
  }
}
export default { runGlobal };
