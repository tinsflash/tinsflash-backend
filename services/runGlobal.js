// services/runGlobal.js
// 🌍 RUN GLOBAL – Europe + USA

import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import { processAlerts } from "./alertsService.js";
import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";

export async function runGlobal(zone = "Europe") {
  const state = getEngineState();
  try {
    addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})…`);
    state.runTime = new Date().toISOString();
    state.checkup.globalRun = "PENDING";
    saveEngineState(state);

    let alerts = [];

    // === EUROPE ===
    if (zone === "Europe" || zone === "ALL") {
      try {
        const europeAlerts = await runGlobalEurope();
        alerts = [...alerts, ...europeAlerts];
        addEngineLog("✅ Run Global Europe terminé");
      } catch (err) {
        addEngineError("Erreur RunGlobal Europe: " + err.message);
      }
    }

    // === USA ===
    if (zone === "USA" || zone === "ALL") {
      try {
        const usaAlerts = await runGlobalUSA();
        alerts = [...alerts, ...usaAlerts];
        addEngineLog("✅ Run Global USA terminé");
      } catch (err) {
        addEngineError("Erreur RunGlobal USA: " + err.message);
      }
    }

    // === Analyse IA Globale ===
    try {
      const aiPrompt = `
Analyse météo RUN GLOBAL – Zone ${zone}
Objectif: Détecter les anomalies météo majeures (tempête, cyclone, inondation, canicule, etc.).

Consignes:
1. Analyse les signaux de TOUS les modèles (GFS, ECMWF, ICON, Meteomatics, Copernicus, NASA, NOAA, etc.).
2. Vérifie explicitement si NOUS SOMMES LES PREMIERS à détecter l’anomalie par rapport aux modèles et open-data (OpenWeather, NOAA).
3. Si oui, mets "firstDetector": true, sinon false.
4. Ajoute intensité, conséquences possibles et recommandations pratiques.
5. Indique fiabilité entre 0 et 100.

Réponds en JSON strict:
{ "zone": "${zone}", "type": "...", "reliability": ..., "firstDetector": true/false, "intensity": "...", "consequences": "...", "recommendations": "..." }
`;

      const aiAnalysis = await askOpenAI(aiPrompt);
      try {
        const parsed = JSON.parse(aiAnalysis);
        alerts.push(parsed);
      } catch {
        addEngineError("⚠️ Impossible de parser l’analyse IA globale");
      }
    } catch (err) {
      addEngineError("Erreur analyse IA globale: " + err.message);
    }

    // Sauvegarde + process
    state.globalAlerts = alerts;
    state.alertsList = [...(state.alertsList || []), ...alerts];
    state.checkup.globalRun = alerts.length > 0 ? "OK" : "FAIL";
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
    addEngineLog("✅ RUN GLOBAL terminé");
    return { alerts, alertStats };
  } catch (err) {
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    addEngineLog("❌ RUN GLOBAL en échec");
    return { error: err.message };
  }
}
