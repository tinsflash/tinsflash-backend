// services/runGlobal.js
import forecastService from "./forecastService.js";
import { detectAlerts } from "./alertDetector.js";
import { processAlerts } from "./alertsEngine.js";
import { addLog } from "./adminLogs.js";
import { getEngineState, saveEngineState, addEngineLog, addEngineError } from "./engineState.js";

const COVERED = [
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Romania","Slovakia","Slovenia","Sweden",
  "Ukraine","United Kingdom","Norway","USA"
];

export default async function runGlobal() {
  const startedAt = new Date().toISOString();
  addLog("RUN GLOBAL démarré"); addEngineLog("RUN GLOBAL démarré");

  const zonesCovered = {};
  const allAlerts = [];

  for (const country of COVERED) {
    try {
      const national = await forecastService.getNationalForecast(country);
      if (national?.forecasts) {
        for (const fc of Object.values(national.forecasts)) {
          const alerts = detectAlerts(fc, { scope:"covered", country });
          allAlerts.push(...alerts);
        }
      }
      zonesCovered[country] = true;
      addEngineLog(`✅ ${country} traité`);
    } catch (err) {
      addEngineError(`❌ ${country}: ${err.message}`);
      zonesCovered[country] = false;
    }
  }

  processAlerts(allAlerts);

  const prev = getEngineState();
  const newState = { runTime: startedAt, zonesCovered, errors: prev.errors||[], logs: prev.logs||[] };
  saveEngineState(newState);

  addLog("RUN GLOBAL terminé"); addEngineLog("RUN GLOBAL terminé");

  return { startedAt, countriesProcessed:Object.keys(zonesCovered).length, alerts: allAlerts.length };
}
