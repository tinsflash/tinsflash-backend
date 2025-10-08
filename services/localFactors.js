// services/localFactors.js
// 🌍 Ajustements locaux et géographiques (altitude, urbanisation, côte, microclimat)
// 🔁 Fusion de geoFactors + localFactors
import axios from "axios";
import { addEngineLog } from "./engineState.js";

const cache = new Map();
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Ajuste les prévisions météo selon les conditions locales et géographiques
 */
export async function applyLocalFactors(forecast, lat = 0, lon = 0, country = "GLOBAL", region = "GENERIC") {
  try {
    if (!forecast) return forecast;
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;

    // 🧠 Cache rapide anti-API 429
    if (cache.has(key)) return cache.get(key);

    // 🌄 Relief (Open-Elevation)
    let elevation = 0;
    try {
      const res = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`, { timeout: 5000 });
      elevation = res.data.results?.[0]?.elevation ?? 0;
    } catch {
      elevation = 0;
      await addEngineLog(`⚠️ Élévation indisponible (${lat},${lon})`, "warning", "localFactors");
    }

    // 🏔️ Altitude
    if (elevation > 400) {
      forecast.temperature = (forecast.temperature ?? 15) - 2;
      forecast.humidity = (forecast.humidity ?? 60) + 5;
    }

    // 🌆 Urbain / rural
    if (region.includes("Urban") || ["Belgium", "France"].includes(country)) {
      forecast.temperature = (forecast.temperature ?? 15) + 0.5;
      forecast.humidity = (forecast.humidity ?? 60) - 2;
    }

    // 🌊 Influence maritime
    if (lon > -5 && lon < 10) {
      forecast.humidity = (forecast.humidity ?? 60) + 3;
      forecast.reliability = (forecast.reliability ?? 70) + 2;
    }

    // 🧭 Résumé local
    forecast.localAdjust = {
      elevation,
      region,
      country,
      microfactor: "relief+urbanisation+océan",
    };

    cache.set(key, forecast);
    await delay(200);
    await addEngineLog(`🌡️ LocalFactors appliqués (${country}, alt ${elevation}m)`, "info", "localFactors");
    return forecast;
  } catch (err) {
    await addEngineLog(`⚠️ LocalFactors erreur : ${err.message}`, "error", "localFactors");
    return forecast;
  }
}

export default { applyLocalFactors };
