// PATH: services/runContinental.js
// RUN CONTINENTAL – Détection anomalies sur zones non couvertes
// Objectif : générer des alertes continentales

import { askAI } from "./chatService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";

const continents = ["Europe", "Africa", "Asia", "North America", "South America", "Oceania"];

export async function runContinental() {
  const state = getEngineState();
  try {
    addEngineLog("🌍 Lancement du RUN CONTINENTAL…");

    const alerts = [];

    for (const cont of continents) {
      try {
        addEngineLog(`🔎 Analyse IA continentale : ${cont}…`);

        const aiPrompt = `
Analyse météo RUN CONTINENTAL – ${cont}
Objectif: détecter toute anomalie majeure (tempête, cyclone, vague de chaleur, inondation…).
Réponds en JSON strict :
{ "continent": "${cont}", "type": "string", "reliability": 0-100, "firstDetector": true/false }
        `;

        const aiAnalysis = await askAI(aiPrompt);
        let parsedAlert;

        try {
          parsedAlert = JSON.parse(aiAnalysis);
          alerts.push(parsedAlert);
          addEngineLog(`✅ Alerte continentale détectée : ${cont} (${parsedAlert.type}) fiabilité ${parsedAlert.reliability}%`);
        } catch {
          addEngineError("⚠️ Impossible de parser l’alerte continentale " + cont);
        }
      } catch (err) {
        addEngineError(`Erreur sur continent ${cont}: ${err.message}`);
      }
    }

    // Sauvegarde
    state.continentalAlerts = alerts;
    state.alertsList = [...(state.alertsList || []), ...alerts];
    saveEngineState(state);

    // Tri via alertsService
    addEngineLog("🚨 Tri et classification des alertes continentales…");
    const alertStats = await processAlerts();
    addEngineLog("✅ RUN CONTINENTAL terminé");

    return { alerts, alertStats };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN CONTINENTAL");
    addEngineLog("❌ Erreur dans RUN CONTINENTAL");
    return { error: err.message };
  }
}
