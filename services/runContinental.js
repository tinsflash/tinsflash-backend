// services/runContinental.js
// 🌎 RUN CONTINENTAL – Détection d’anomalies majeures par continent

import { askOpenAI } from "./openaiService.js";
import { addLog } from "./adminLogs.js";
import { getEngineState, saveEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";

const continents = ["Europe", "Africa", "Asia", "North America", "South America", "Oceania"];

export async function runContinental() {
  const state = await getEngineState();
  state.runTime = new Date().toISOString();
  state.status = "RUNNING";
  state.checkup.continentalAlerts = "PENDING";
  await saveEngineState(state);

  try {
    await addLog("🌎 Lancement du RUN CONTINENTAL…");
    const alerts = [];

    for (const cont of continents) {
      await addLog(`🔎 Analyse continentale en cours: ${cont}`);
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
          await addLog(`✅ Alerte détectée pour ${cont}: ${parsed.type} (${parsed.reliability}%)`);
        } catch {
          await addLog(`⚠️ Impossible de parser la réponse AI pour ${cont}`);
        }
      } catch (err) {
        await addLog(`❌ Erreur analyse ${cont}: ${err.message}`);
      }
    }

    state.continentalAlerts = alerts;
    state.checkup.continentalAlerts = alerts.length > 0 ? "OK" : "FAIL";
    await saveEngineState(state);

    // Traitement global des alertes
    const alertStats = await processAlerts();
    if (alertStats.error) {
      state.checkup.globalAlerts = "FAIL";
      await addLog(`💥 Erreur traitement alertes globales: ${alertStats.error}`);
    } else {
      state.checkup.globalAlerts = "OK";
      await addLog("🌐 Alertes globales traitées avec succès");
    }
    await saveEngineState(state);

    state.status = "OK";
    state.checkup.engineStatus = "OK";
    await saveEngineState(state);

    await addLog("🚀 RUN CONTINENTAL terminé");
    return { success: true, alerts, alertStats };
  } catch (err) {
    state.status = "FAIL";
    state.checkup.engineStatus = "FAIL";
    await saveEngineState(state);

    await addLog("💥 Erreur RUN CONTINENTAL: " + err.message);
    return { success: false, error: err.message };
  }
}
