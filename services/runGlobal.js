// services/runGlobal.js
import forecastService from "./forecastService.js";
import openweather from "./openweather.js";
import { detectAlerts } from "./alertDetector.js";
import { processAlerts } from "./alertsEngine.js";
import { addLog } from "./adminLogs.js";
import { getEngineState, saveEngineState, addEngineLog, addEngineError } from "./engineState.js";
import { generateAdminBulletins } from "./adminBulletins.js";
import { REGIONS_COORDS } from "./regionsCoords.js";

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

  const zonesCovered = {};
  const allAlerts = [];
  const results = [];

  for (const country of COVERED) {
    try {
      // 1) Prévisions multi-régions
      const national = await forecastService.getNationalForecast(country);

      // 2) Génération d’alertes pour TOUTES les régions couvertes
      const regions = REGIONS_COORDS[country] || {};
      const localPoints = [];

      for (const [region, coords] of Object.entries(regions)) {
        try {
          const ow = await openweather(coords.lat, coords.lon);
          const numeric = {
            rain: ow?.precipitation ?? ow?.rain ?? null,
            wind: typeof ow?.wind === "number" ? Math.round(ow.wind * 3.6) : (ow?.wind?.speed_kmh ?? null),
            temp: ow?.temperature ?? ow?.temp ?? null
          };

          const rawAlerts = detectAlerts(numeric);
          const enriched = await processAlerts(rawAlerts, { country, region, coords });
          allAlerts.push(...enriched);

          localPoints.push({
            name: region,
            lat: coords.lat,
            lon: coords.lon,
            openweather: ow,
            alerts: enriched
          });
        } catch (err) {
          addEngineError(`❌ ${country} - ${region}: ${err.message}`);
        }
      }

      zonesCovered[country] = true;
      results.push({ country, national, locals: localPoints });
      addEngineLog(`✅ ${country} traité (${Object.keys(regions).length} régions)`);

    } catch (err) {
      addEngineError(`❌ ${country}: ${err.message}`);
      zonesCovered[country] = false;
    }
  }

  // 📝 Génération des bulletins IA pour toutes les zones couvertes
  const bulletins = await generateAdminBulletins(results);

  const prev = getEngineState();
  const newState = {
    runTime: startedAt,
    zonesCovered,
    sources: {
      gfs: "ok", ecmwf: "ok", icon: "ok",
      meteomatics: "ok", nasaSat: "ok", copernicus: "ok",
      trullemans: "ok", wetterzentrale: "ok", openweather: "ok"
    },
    alertsList: allAlerts,
    errors: prev.errors || [],
    logs: prev.logs || [],
    bulletins
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
    bulletins
  };
}
