// services/forecastService.js
// Bulletin national et local — basé sur SuperForecast et runGlobal
// ⚡ Centrale nucléaire météo – Vue utilisateur enrichie

import { runSuperForecast } from "./superForecast.js";
import openweather from "./openweather.js";
import { ALL_ZONES } from "./runGlobal.js"; 

/** Bulletin national (zones couvertes) */
async function getNationalForecast(country) {
  try {
    const zones = ALL_ZONES[country];
    if (!zones) {
      return { country, source: "Centrale Nucléaire Météo", error: "Pays non couvert", forecasts: {} };
    }

    // 🔹 Exécution en parallèle pour toutes les zones
    const results = await Promise.all(zones.map(async (z) => {
      const sf = await runSuperForecast({
        lat: z.lat,
        lon: z.lon,
        country,
        region: z.region,
      });
      return [
        z.region,
        {
          lat: z.lat,
          lon: z.lon,
          country,
          forecast: sf.forecast || "⚠️ Pas de données",
          sources: sf.sources || null,
          enriched: sf.enriched || null,
          source: "Centrale Nucléaire Météo",
          note:
            country === "USA"
              ? "⚡ HRRR intégré (précision USA)"
              : ["FR", "BE"].includes(country)
              ? "⚡ AROME intégré (précision France/Belgique)"
              : "Sources standards (GFS/ECMWF/ICON/Meteomatics)",
        },
      ];
    }));

    const forecasts = Object.fromEntries(results);
    return { country, source: "Centrale Nucléaire Météo", forecasts };
  } catch (err) {
    console.error("❌ getNationalForecast error:", err.message);
    return { country, source: "Centrale Nucléaire Météo", error: err.message, forecasts: {} };
  }
}

/** Prévision locale (point unique) */
async function getLocalForecast(lat, lon, country) {
  try {
    const zones = ALL_ZONES[country];
    if (zones) {
      const sf = await runSuperForecast({ lat, lon, country });
      return {
        lat,
        lon,
        country,
        forecast: sf.forecast,
        sources: sf.sources,
        enriched: sf.enriched || null,
        source: "Centrale Nucléaire Météo",
        note:
          country === "USA"
            ? "⚡ HRRR intégré (précision USA)"
            : ["FR", "BE"].includes(country)
            ? "⚡ AROME intégré (précision France/Belgique)"
            : "Sources standards (GFS/ECMWF/ICON/Meteomatics)",
      };
    }

    // ⚠️ Fallback si hors zones couvertes
    const ow = await openweather(lat, lon);
    return {
      lat,
      lon,
      country,
      forecast: {
        resume: "Prévisions OpenWeather",
        data: ow,
      },
      source: "OpenWeather (fallback)",
    };
  } catch (err) {
    console.error("❌ getLocalForecast error:", err.message);
    return { lat, lon, country, source: "Centrale Nucléaire Météo", error: err.message, forecasts: {} };
  }
}

// ✅ Export par défaut
export default { getNationalForecast, getLocalForecast };
