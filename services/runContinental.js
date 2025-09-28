// PATH: services/runContinental.js
// Run Continental – Zones non couvertes → alertes continentales
// ⚡ Centrale nucléaire météo – détection anomalies globales

import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";

// Continents suivis
const continents = ["Europe", "Africa", "Asia", "North America", "South America", "Oceania"];

export async function runContinental() {
  const state = getEngineState();
  try {
    addEngineLog("🌎 Lancement du RUN CONTINENTAL…");

    const alerts = [];

    for (const cont of continents) {
      try {
        const aiPrompt = `
Analyse météo RUN CONTINENTAL – ${cont}
Objectif: détecter toute anomalie majeure (tempête, cyclone, vague de chaleur, inondation…).
Sources disponibles: résultats globaux précédents, anomalies inter-modèles.
Consignes:
1. Générer des alertes continentales uniquement (pas locales).
2. Donner un indice de fiabilité (0–100).
3. Indiquer si nous sommes les premiers à détecter.
Réponds en JSON: { continent, type, reliability, firstDetector }
`;

        const aiAnalysis = await askOpenAI(aiPrompt);
        let parsedAlert;

        try {
          parsedAlert = JSON.parse(aiAnalysis);
          alerts.push(parsedAlert);
        } catch {
          addEngineError("⚠️ Impossible de parser l’alerte continentale " + cont);
        }
      } catch (err) {
        addEngineError(`Erreur sur continent ${cont}: ${err.message}`);
      }
    }

    // Stocker dans state
    state.continentalAlerts = alerts;
    state.alertsList = [...(state.alertsList || []), ...alerts];
    saveEngineState(state);

    // Tri via alertsService
    const alertStats = await processAlerts();

    addEngineLog("✅ RUN CONTINENTAL terminé");
    return { alerts, alertStats };
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN CONTINENTAL");
    return { error: err.message };
  }
}
