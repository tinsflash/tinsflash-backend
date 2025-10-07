// services/runWorldAlerts.js
// 🌍 Fusion mondiale des alertes (Europe + USA + Continental)
// Europe et USA = moteur TINSFLASH ✅
// Continental = fallback open-data ⚠️
// Objectif : fournir une vue mondiale cohérente pour la console et l’IA J.E.A.N.

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

export async function runWorldAlerts() {
  const state = getEngineState();
  state.checkup = state.checkup || {};

  addEngineLog("🌍 Initialisation RUN World Alerts (fusion globale des alertes)…");

  try {
    // Vérification préalable
    if (!state.alertsEurope && !state.alertsUSA && !state.alertsContinental) {
      addEngineError("⚠️ Aucune alerte disponible dans aucune zone !");
      state.checkup.alertsWorld = "FAIL";
      saveEngineState(state);
      return { summary: {}, alerts: {} };
    }

    // === Fusion mondiale ===
    const worldAlerts = {
      Europe: state.alertsEurope || {},
      USA: state.alertsUSA || {},
      Continental: state.alertsContinental || {},
    };

    // === Comptage global ===
    const countAlerts = (obj) => {
      if (!obj || typeof obj !== "object") return 0;
      let count = 0;
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) count += obj[key].length;
        else count++;
      }
      return count;
    };

    const summary = {
      europeAlerts: countAlerts(state.alertsEurope),
      usaAlerts: countAlerts(state.alertsUSA),
      continentalAlerts: countAlerts(state.alertsContinental),
    };

    summary.totalAlerts =
      summary.europeAlerts + summary.usaAlerts + summary.continentalAlerts;

    summary.generatedAt = new Date().toISOString();
    summary.sourceNote =
      "✅ Europe/USA = moteur TINSFLASH | ⚠️ Continental = fallback open-data";

    // === Écriture état moteur ===
    state.alertsWorld = worldAlerts;
    state.alertsWorldSummary = summary;
    state.checkup.alertsWorld = "OK";
    saveEngineState(state);

    // === Logs détaillés ===
    addEngineLog(`🌍 Fusion World Alerts terminée.`);
    addEngineLog(
      `📊 Total : ${summary.totalAlerts} (EU: ${summary.europeAlerts}, US: ${summary.usaAlerts}, CT: ${summary.continentalAlerts})`
    );

    return { summary, alerts: worldAlerts };
  } catch (err) {
    addEngineError("❌ Erreur RUN World Alerts: " + err.message);
    state.checkup.alertsWorld = "FAIL";
    saveEngineState(state);
    throw err;
  }
}
