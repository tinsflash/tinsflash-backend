// services/forecastService.js
// Bulletin national et local — basé sur SuperForecast et runGlobal
// ⚡ Centrale nucléaire météo – Vue utilisateur

import { runSuperForecast } from "./superForecast.js";
import openweather from "./openweather.js";
import { ALL_ZONES } from "./runGlobal.js"; // ✅ centralisation zones (Europe, USA, etc.)

/** Bulletin national (zones couvertes) */
async function getNationalForecast(country) {
  try {
    const zones = ALL_ZONES[country];
    if (!zones) {
      return { country, error: "Pays non couvert", forecasts: {} };
    }

    const forecasts = {};
    for (const z of zones) {
      let sf = await runSuperForecast({ lat: z.lat, lon: z.lon, country, region: z.region });
      forecasts[z.region] = {
        lat: z.lat,
        lon: z.lon,
        country,
        forecast: sf.forecast || "⚠️ Pas de données",
        sources: sf.sources || null,
      };
    }

    return { country, forecasts, source: "Centrale Nucléaire Météo" };
  } catch (err) {
    console.error("❌ getNationalForecast error:", err.message);
    return { country, error: err.message, forecasts: {} };
  }
}

/** Prévision locale (point unique) */
async function getLocalForecast(lat, lon, country) {
  try {
    const zones = ALL_ZONES[country];
    if (zones) {
      let sf = await runSuperForecast({ lat, lon, country });
      return sf;
    }
    // Fallback si hors zones couvertes
    const ow = await openweather(lat, lon);
    return { lat, lon, country, forecast: ow, source: "OpenWeather (fallback)" };
  } catch (err) {
    console.error("❌ getLocalForecast error:", err.message);
    return { lat, lon, country, error: err.message };
  }
}

// ✅ Export par défaut (inchangé pour Render)
export default { getNationalForecast, getLocalForecast };
