// services/runWorldAlerts.js
// 🌍 Fusion mondiale des alertes (Europe + USA + Continental)
// Les zones couvertes (Europe, USA) utilisent notre moteur TINSFLASH.
// Les zones hors couverture (Continental) sont marquées comme fallback.

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

export async function runWorldAlerts() {
  const state = getEngineState();
  state.checkup = state.checkup || {};
  addEngineLog("🌍 Démarrage RUN World Alerts (fusion globale)…");

  try {
    const worldAlerts = {
      Europe: state.alertsEurope || {},
      USA: state.alertsUSA || {},
      Continental: state.alertsContinental || {}
    };

    // Comptage global
    const summary = {
      europeAlerts: Object.keys(state.alertsEurope || {}).length,
      usaAlerts: Object.keys(state.alertsUSA || {}).length,
      continentalAlerts: Object.keys(state.alertsContinental || {}).length,
      totalAlerts:
        (Object.keys(state.alertsEurope || {}).length) +
        (Object.keys(state.alertsUSA || {}).length) +
        (Object.keys(state.alertsContinental || {}).length)
    };

    state.alertsWorld = worldAlerts;
    state.alertsWorldSummary = summary;
    state.checkup.alertsWorld = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN World Alerts terminé avec succès.");
    return { summary, alerts: worldAlerts };

  } catch (err) {
    addEngineError("❌ Erreur RUN World Alerts: " + err.message);
    state.checkup.alertsWorld = "FAIL";
    saveEngineState(state);
    throw err;
  }
}
