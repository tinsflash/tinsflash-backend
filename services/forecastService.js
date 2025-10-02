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
      return { 
        country, 
        source: "Centrale Nucléaire Météo", 
        error: "Pays non couvert", 
        forecasts: {} 
      };
    }

    const results = await Promise.all(zones.map(async (z) => {
      try {
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
            forecast: sf?.forecast || "⚠️ Pas de données",
            sources: sf?.sources || null,
            enriched: sf?.enriched || null,
            source: "Centrale Nucléaire Météo",
            note: country === "USA"
              ? "⚡ Fusion multi-modèles + HRRR (USA)"
              : "⚡ Fusion multi-modèles (GFS/ECMWF/ICON/Meteomatics + Copernicus/NASA + benchmarks)",
          },
        ];
      } catch (e) {
        return [
          z.region,
          {
            lat: z.lat,
            lon: z.lon,
            country,
            forecast: "❌ Erreur lors du calcul",
            error: e.message,
            source: "Centrale Nucléaire Météo",
          },
        ];
      }
    }));

    return { country, source: "Centrale Nucléaire Météo", forecasts: Object.fromEntries(results) };
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
        forecast: sf?.forecast || "⚠️ Pas de données",
        sources: sf?.sources || null,
        enriched: sf?.enriched || null,
        source: "Centrale Nucléaire Météo",
        note: country === "USA"
          ? "⚡ Fusion multi-modèles + HRRR (USA)"
          : "⚡ Fusion multi-modèles (GFS/ECMWF/ICON/Meteomatics + Copernicus/NASA + benchmarks)",
      };
    }

    // ⚠️ Fallback si hors zones couvertes
    const ow = await openweather(lat, lon);
    return {
      lat,
      lon,
      country,
      forecast: {
        resume: "Prévisions OpenWeather (fallback hors zones couvertes)",
        data: ow,
        fiabilite: "≈45%",
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
