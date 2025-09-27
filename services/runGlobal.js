// services/runGlobal.js
// ⚡ Centrale nucléaire météo — RUN GLOBAL
import forecastService from "./forecastService.js";
import { resetEngineState, saveEngineState, addLog, getEngineState } from "./engineState.js";
import { classifyAlert, resetAlerts } from "./alertsService.js";

const COVERED = [
  "Germany","Austria","Belgium","Bulgaria","Cyprus","Croatia","Denmark",
  "Spain","Estonia","Finland","France","Greece","Hungary","Ireland",
  "Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands",
  "Poland","Portugal","Czechia","Romania","Slovakia","Slovenia","Sweden",
  "Ukraine","United Kingdom","Norway","USA"
];

export default async function runGlobal() {
  resetEngineState();
  resetAlerts();
  addLog("🔵 RUN GLOBAL démarré", "system");

  const startedAt = new Date().toISOString();
  const modelsOk = ["GFS","ECMWF","ICON","Meteomatics"];
  const modelsKo = []; // à compléter si échec
  const sourcesOk = ["NASA","Copernicus","OpenWeather"];
  const sourcesKo = []; // idem

  const zonesProcessed = [];
  const alertsGenerated = [];

  for (const country of COVERED) {
    try {
      addLog(`⏳ Prévisions ${country}…`, "info");

      // 1️⃣ Récupérer prévisions nationales
      const national = await forecastService.getForecast(country);

      // 2️⃣ Marquer prévisions nationales
      saveEngineState({
        forecasts: { ...getEngineState().forecasts, national: true },
      });

      // 3️⃣ Prévisions locales (si dispo)
      if (national?.forecasts) {
        saveEngineState({
          forecasts: { ...getEngineState().forecasts, local: true },
        });

        for (const [region, fc] of Object.entries(national.forecasts)) {
          // 🔔 Exemple d’alerte brute (dans la réalité → analyse IA du forecast)
          if (fc?.risk && fc.risk > 0.7) {
            const alert = {
              id: `${country}-${region}-${Date.now()}`,
              zone: `${region}, ${country}`,
              fiability: Math.round(fc.risk * 100),
              details: fc,
            };
            classifyAlert(alert);
            alertsGenerated.push(alert);
          }
        }
      }

      zonesProcessed.push(country);
      addLog(`✅ ${country} traité`, "success");
    } catch (err) {
      addLog(`❌ Erreur ${country}: ${err.message}`, "error");
      modelsKo.push(country);
    }
  }

  // 🔄 Finalisation moteur
  saveEngineState({
    runTime: startedAt,
    models: { ok: modelsOk, ko: modelsKo },
    sources: { ok: sourcesOk, ko: sourcesKo },
    alerts: {
      local: alertsGenerated.length > 0,
      national: zonesProcessed.length > 0,
      continental: false, // réservé pour runContinental
      world: alertsGenerated.length > 0,
    },
    ia: { forecasts: true, alerts: true },
  });

  addLog("🟢 RUN GLOBAL terminé", "system");

  return {
    startedAt,
    modelsOk,
    modelsKo,
    sourcesOk,
    sourcesKo,
    zonesProcessed,
    alertsGenerated: alertsGenerated.length,
  };
}
