// services/runContinental.js
// 🌎 RUN CONTINENTAL – Zones non couvertes → alertes continentales

import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";

const continents = ["Europe", "Africa", "Asia", "North America", "South America", "Oceania"];

export async function runContinental() {
  const state = getEngineState();
  try {
    addEngineLog("🌎 Lancement du RUN CONTINENTAL…");
    state.runTime = new Date().toISOString();
    state.checkup.continentalAlerts = "PENDING";
    saveEngineState(state);

    const alerts = [];

    for (const cont of continents) {
      try {
        const aiPrompt = `
Analyse météo RUN CONTINENTAL – ${cont}
Objectif: détecter toute anomalie majeure (tempête, cyclone, vague de chaleur, inondation…).
Consignes:
1. Générer des alertes continentales uniquement.
2. Donner un indice de fiabilité (0–100).
3. Indiquer si nous sommes les premiers à détecter.
Réponds en JSON: { continent, type, reliability, firstDetector }
`;
        const aiAnalysis = await askOpenAI(aiPrompt);
        try {
          const parsed = JSON.parse(aiAnalysis);
          alerts.push(parsed);
        } catch {
          addEngineError("⚠️ Impossible de parser l’alerte continentale " + cont);
        }
      } catch (err) {
        addEngineError(`Erreur sur continent ${cont}: ${err.message}`);
      }
    }

    state.continentalAlerts = alerts;
    state.alertsList = [...(state.alertsList || []), ...alerts];
    state.checkup.continentalAlerts = alerts.length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    const alertStats = await processAlerts();
    if (alertStats.error) {
      state.checkup.globalAlerts = "FAIL";
      addEngineError(alertStats.error);
    } else {
      state.checkup.globalAlerts = "OK";
    }
    saveEngineState(state);

    state.checkup.engineStatus = "OK";
    saveEngineState(state);
    addEngineLog("✅ RUN CONTINENTAL terminé");
    return { alerts, alertStats };
  } catch (err) {
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineError(err.message || "Erreur inconnue RUN CONTINENTAL");
    addEngineLog("❌ RUN CONTINENTAL en échec");
    return { error: err.message };
  }
}
