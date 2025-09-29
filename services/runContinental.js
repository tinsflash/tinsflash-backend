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
Objectif: Détecter les anomalies météo majeures (tempête, cyclone, vague de chaleur, inondation).

Consignes:
1. Génère uniquement des alertes CONTINENTALES.
2. Donne un indice de fiabilité (0–100).
3. Vérifie explicitement si NOUS SOMMES LES PREMIERS à détecter l’anomalie par rapport aux modèles GFS, ECMWF, ICON et aux sources open-data (OpenWeather, NOAA).
4. Si oui, mets "firstDetector": true, sinon false.
5. Ajoute intensité, conséquences possibles et recommandations pratiques.

Réponds uniquement en JSON strict:
{ "continent": "${cont}", "type": "...", "reliability": ..., "firstDetector": true/false, "intensity": "...", "consequences": "...", "recommendations": "..." }
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

    const alertStats = await processAlerts(alerts);
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
