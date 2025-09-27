import forecastService from "./forecastService.js";
import { detectAlerts, classifyAlerts } from "./alertDetector.js";
import { addLog } from "./adminLogs.js";
import {
  getEngineState,
  saveEngineState,
  addEngineLog,
  addEngineError,
} from "./engineState.js";
import { checkSourcesFreshness } from "./sourcesFreshness.js";

const COVERED = [
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Romania","Slovakia","Slovenia","Sweden",
  "Ukraine","United Kingdom","Norway","USA"
];

export default async function runGlobal() {
  const startedAt = new Date().toISOString();
  addLog("RUN GLOBAL démarré");
  addEngineLog("RUN GLOBAL démarré");

  // 🔥 Vérification fraicheur des sources
  const sources = await checkSourcesFreshness();

  const zonesCovered = {};
  const allAlerts = [];
  const results = [];

  for (const country of COVERED) {
    try {
      const national = await forecastService.getForecast(country);

      let localPoints = [];
      if (national?.forecasts) {
        for (const [region, fc] of Object.entries(national.forecasts)) {
          const rawAlerts = detectAlerts(fc);
          const enriched = classifyAlerts(rawAlerts, { country, capital: region });
          allAlerts.push(...enriched);

          localPoints.push({
            region,
            forecast: fc,
            alerts: enriched,
          });
        }
      }

      zonesCovered[country] = true;
      results.push({ country, national, local: localPoints });
      addEngineLog(`✅ ${country} traité (${localPoints.length} points analysés)`);
    } catch (err) {
      addEngineError(`❌ ${country}: ${err.message}`);
      zonesCovered[country] = false;
    }
  }

  const prev = getEngineState();
  const newState = {
    runTime: startedAt,
    zonesCovered,
    sources,              // ✅ Fraicheur des modèles intégrée
    alertsList: allAlerts,
    errors: prev.errors || [],
    logs: prev.logs || [],
  };

  saveEngineState(newState);
  addLog("RUN GLOBAL terminé");
  addEngineLog("RUN GLOBAL terminé");

  return {
    startedAt,
    countriesProcessed: Object.keys(zonesCovered).length,
    countriesOk: Object.keys(zonesCovered).filter(c => zonesCovered[c]),
    countriesFailed: Object.keys(zonesCovered).filter(c => !zonesCovered[c]),
    alerts: allAlerts.length,
    sources,             // ✅ Retourne aussi les sources dans la réponse
  };
}
