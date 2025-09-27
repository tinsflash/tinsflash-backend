// services/runGlobal.js
// RUN GLOBAL — Centrale Nucléaire Météo
// ⚡ Analyse toutes les zones couvertes (Europe + UK + Ukraine + USA + Norvège)

import forecastService from "./forecastService.js";
import { detectAlerts, classifyAlerts } from "./alertDetector.js";
import { addLog } from "./adminLogs.js";
import {
  saveEngineState,
  addEngineLog,
  addEngineError
} from "./engineState.js";

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

  // 🔄 Réinitialisation état moteur pour ce cycle
  const zonesCovered = {};
  const allAlerts = [];
  const results = [];
  const errors = [];
  const logs = [];

  for (const country of COVERED) {
    try {
      // 1️⃣ Prévision nationale
      const national = await forecastService.getForecast(country);

      // 2️⃣ Prévisions locales + détection alertes
      const localPoints = [];
      if (national?.forecasts) {
        for (const [region, fc] of Object.entries(national.forecasts)) {
          const rawAlerts = detectAlerts(fc) || [];
          const enriched = classifyAlerts(rawAlerts, { country, capital: region });
          if (enriched?.length) allAlerts.push(...enriched);

          localPoints.push({
            region,
            forecast: fc,
            alerts: enriched
          });
        }
      }

      zonesCovered[country] = true;
      results.push({ country, national, local: localPoints });
      logs.push(`✅ ${country} traité (${localPoints.length} points analysés)`);

    } catch (err) {
      addEngineError(`❌ ${country}: ${err.message}`);
      zonesCovered[country] = false;
      errors.push(`${country}: ${err.message}`);
    }
  }

  // 3️⃣ Synthèse moteur
  const newState = {
    runTime: startedAt,
    zonesCovered,
    sources: {
      gfs: "ok", ecmwf: "ok", icon: "ok",
      meteomatics: "ok", nasaSat: "ok", copernicus: "ok",
      trullemans: "ok", wetterzentrale: "ok", openweather: "ok"
    },
    alertsList: allAlerts,
    errors,
    logs
  };

  saveEngineState(newState);
  addLog("RUN GLOBAL terminé");
  addEngineLog("RUN GLOBAL terminé");

  return {
    startedAt,
    countriesProcessed: Object.keys(zonesCovered).length,
    countriesOk: Object.keys(zonesCovered).filter(c => zonesCovered[c]),
    countriesFailed: Object.keys(zonesCovered).filter(c => !zonesCovered[c]),
    alerts: allAlerts.length
  };
}
