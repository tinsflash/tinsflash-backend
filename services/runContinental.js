// services/runContinental.js
// 🌎 RUN CONTINENTAL – zones non couvertes → alertes continentales

import { askOpenAI } from "./openaiService.js";
import { addLog, addError } from "./adminLogs.js";
import { saveEngineState, getEngineState } from "./engineState.js";
import { addAlert, processAlerts } from "./alertsService.js";

const continents = ["Europe", "Africa", "Asia", "North America", "South America", "Oceania"];

export async function runContinental() {
  const state = getEngineState();
  try {
    await addLog("🌎 Lancement du RUN CONTINENTAL…");
    state.runTime = new Date().toISOString();
    state.checkup.continentalAlerts = "PENDING";
    saveEngineState(state);

    const alerts = [];

    for (const cont of continents) {
      try {
        const prompt = `
Analyse météo RUN CONTINENTAL – ${cont}
Objectif: anomalies majeures (cyclones, vagues de chaleur, inondations).
Réponds en JSON strict:
{ 
  continent: "${cont}",
  type: "string",
  reliability: 0-100,
  firstDetector: true/false,
  details: {
    start: "ISO date",
    end: "ISO date",
    zones: ["zones touchées"],
    intensity: "valeurs précises (vent, pluie, températures…)",
    consequences: ["liste"],
    recommendations: ["liste"]
  }
}
`;
        const raw = await askOpenAI(prompt);
        const parsed = JSON.parse(raw);
        alerts.push(parsed);

        await addAlert(parsed); // Ajout direct
        await addLog(`✅ Alerte RUN CONTINENTAL (${cont}): ${parsed.type}, ${parsed.reliability}%`);
      } catch (err) {
        await addError(`Erreur RUN CONTINENTAL ${cont}: ${err.message}`);
      }
    }

    state.continentalAlerts = alerts;
    state.checkup.continentalAlerts = alerts.length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    const stats = await processAlerts();
    if (stats.error) state.checkup.globalAlerts = "FAIL";
    else state.checkup.globalAlerts = "OK";
    saveEngineState(state);

    await addLog("✅ RUN CONTINENTAL terminé");
    return { alerts, stats };
  } catch (err) {
    state.checkup.continentalAlerts = "FAIL";
    saveEngineState(state);
    await addError("❌ Erreur RUN CONTINENTAL: " + err.message);
    return { error: err.message };
  }
}
