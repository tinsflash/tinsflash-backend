// services/runGlobal.js
import forecastService from "./forecastService.js";
import openweather from "./openweather.js";
import { detectAlerts } from "./alertDetector.js";
import { processAlerts } from "./alertsEngine.js";
import { addLog } from "./adminLogs.js";
import {
  getEngineState,
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

const CAPITALS = {
  Belgium: { lat: 50.8503, lon: 4.3517 },
  France: { lat: 48.8566, lon: 2.3522 },
  Germany: { lat: 52.52, lon: 13.4050 },
  Netherlands: { lat: 52.3676, lon: 4.9041 },
  Spain: { lat: 40.4168, lon: -3.7038 },
  Italy: { lat: 41.9028, lon: 12.4964 },
  Portugal: { lat: 38.7223, lon: -9.1393 },
  Poland: { lat: 52.2297, lon: 21.0122 },
  Czechia: { lat: 50.0755, lon: 14.4378 },
  Austria: { lat: 48.2082, lon: 16.3738 },
  Hungary: { lat: 47.4979, lon: 19.0402 },
  Denmark: { lat: 55.6761, lon: 12.5683 },
  Sweden: { lat: 59.3293, lon: 18.0686 },
  Finland: { lat: 60.1699, lon: 24.9384 },
  Estonia: { lat: 59.4370, lon: 24.7536 },
  Latvia: { lat: 56.9496, lon: 24.1052 },
  Lithuania: { lat: 54.6872, lon: 25.2797 },
  Ireland: { lat: 53.3498, lon: -6.2603 },
  Luxembourg: { lat: 49.6116, lon: 6.1319 },
  Malta: { lat: 35.8997, lon: 14.5147 },
  Cyprus: { lat: 35.1856, lon: 33.3823 },
  Bulgaria: { lat: 42.6977, lon: 23.3219 },
  Romania: { lat: 44.4268, lon: 26.1025 },
  Slovakia: { lat: 48.1486, lon: 17.1077 },
  Slovenia: { lat: 46.0569, lon: 14.5058 },
  Croatia: { lat: 45.8150, lon: 15.9819 },
  Greece: { lat: 37.9838, lon: 23.7275 },
  Norway: { lat: 59.9139, lon: 10.7522 },
  "United Kingdom": { lat: 51.5074, lon: -0.1278 },
  Ukraine: { lat: 50.4501, lon: 30.5234 },
  USA: { lat: 38.9072, lon: -77.0369 }
};

export default async function runGlobal() {
  const startedAt = new Date().toISOString();
  addLog("RUN GLOBAL démarré");
  addEngineLog("RUN GLOBAL démarré");

  const zonesCovered = {};
  const allAlerts = [];
  const results = [];

  for (const country of COVERED) {
    try {
      // 1️⃣ Prévision NATIONALE (multi-sources via forecastService)
      const national = await forecastService.getForecast(country);

      // 2️⃣ Point local minimal (capitale) → OpenWeather
      const cap = CAPITALS[country];
      let localPoint = null;

      if (cap) {
        try {
          const ow = await openweather(cap.lat, cap.lon);

          const numeric = {
            rain: ow?.precipitation ?? ow?.rain ?? null,
            wind: typeof ow?.wind === "number"
              ? Math.round(ow.wind * 3.6)
              : (ow?.wind?.speed_kmh ?? null),
            temp: ow?.temperature ?? ow?.temp ?? null
          };

          // Détection + enrichissement alertes
          const rawAlerts = detectAlerts(numeric);
          const enriched = await processAlerts(rawAlerts, { country, capital: cap });

          allAlerts.push(...enriched);
          localPoint = { lat: cap.lat, lon: cap.lon, openweather: ow, alerts: enriched };
        } catch (owErr) {
          addEngineError(`⚠️ OpenWeather KO pour ${country}: ${owErr.message}`);
        }
      }

      zonesCovered[country] = true;
      results.push({ country, national, local: localPoint });
      addEngineLog(`✅ ${country} traité`);

    } catch (err) {
      addEngineError(`❌ ${country}: ${err.message}`);
      zonesCovered[country] = false;
    }
  }

  // 🔄 Mise à jour état moteur
  const prev = getEngineState();
  const newState = {
    runTime: startedAt,
    zonesCovered,
    sources: {
      gfs: "ok", ecmwf: "ok", icon: "ok",
      meteomatics: "ok", nasaSat: "ok", copernicus: "ok",
      trullemans: "ok", wetterzentrale: "ok", openweather: "ok"
    },
    alerts: allAlerts,
    errors: prev.errors || [],
    logs: prev.logs || []
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
