// PATH: services/forecastService.js
// Bulletin national et local — basé sur SuperForecast et runGlobal
// ⚡ 100 % réel, IA J.E.A.N – multi-modèles, no mock

import { runSuperForecast } from "./superForecast.js";
import openweather from "./openweather.js";
import wetter3Bridge from "./wetter3Bridge.js";
import { COVERED_ZONES } from "./zonesCovered.js";

async function getNationalForecast(country) {
  try {
    const zones = COVERED_ZONES[country];
    if (!zones) {
      return { country, source: "Centrale Nucléaire Météo", error: "Pays non couvert", forecasts: {} };
    }

    const results = await Promise.all(zones.map(async (z) => {
      try {
        const [w3, sf] = await Promise.all([
          wetter3Bridge.getWetter3GFS(z.lat, z.lon).catch(() => null),
          runSuperForecast({ lat: z.lat, lon: z.lon, country, region: z.region })
        ]);
        return [z.region, {
          lat: z.lat, lon: z.lon, country,
          forecast: sf?.forecast || "⚠️ Pas de données",
          wetter3: w3 || null,
          sources: ["Centrale Nucléaire Météo", w3 ? "Wetter3 GFS" : null, "Fusion IA J.E.A.N"].filter(Boolean),
          note: "⚡ Fusion multi-modèles (ECMWF / GFS / ICON / Meteomatics / Copernicus / NASA + Wetter3)"
        }];
      } catch (e) {
        return [z.region, { lat: z.lat, lon: z.lon, forecast: "❌ Erreur", error: e.message }];
      }
    }));

    return { country, source: "Centrale Nucléaire Météo", forecasts: Object.fromEntries(results) };
  } catch (err) {
    console.error("❌ getNationalForecast error:", err.message);
    return { country, error: err.message, forecasts: {} };
  }
}

async function getLocalForecast(lat, lon, country) {
  try {
    const zones = COVERED_ZONES[country];
    if (zones) {
      const [w3, sf] = await Promise.all([
        wetter3Bridge.getWetter3GFS(lat, lon).catch(() => null),
        runSuperForecast({ lat, lon, country })
      ]);
      return {
        lat, lon, country,
        forecast: sf?.forecast || "⚠️ Pas de données",
        wetter3: w3 || null,
        sources: ["Centrale Nucléaire Météo", w3 ? "Wetter3 GFS" : null, "Fusion IA J.E.A.N"].filter(Boolean),
      };
    }

    // fallback openweather
    const ow = await openweather(lat, lon);
    return {
      lat, lon, country,
      forecast: { resume: "Prévisions OpenWeather (fallback hors zones couvertes)", data: ow, fiabilite: "≈45%" },
      source: "OpenWeather (fallback)",
    };
  } catch (err) {
    console.error("❌ getLocalForecast error:", err.message);
    return { lat, lon, country, error: err.message };
  }
}

export default { getNationalForecast, getLocalForecast };
