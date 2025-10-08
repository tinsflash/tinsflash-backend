// services/localFactors.js
// 🌍 Ajustement des prévisions selon les facteurs locaux (relief, mer, climat urbain, etc.)

import fetch from "node-fetch";
import { addEngineLog } from "./engineState.js";

/**
 * Fonction principale : ajuste les prévisions météo selon des facteurs locaux
 */
export async function adjustWithLocalFactors(forecast, lat = 0, lon = 0, region = "GENERIC", country = "GLOBAL") {
  try {
    if (!forecast) return forecast;

    // 🌄 Relief (API Open-Elevation)
    let elevation = 0;
    try {
      const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
      elevation = (await res.json())?.results?.[0]?.elevation ?? 0;
    } catch {
      elevation = 0;
    }

    // 🏔️ Ajustement altitude
    if (elevation > 400) {
      forecast.temperature_min -= 2;
      forecast.temperature_max -= 2;
      forecast.humidity = (forecast.humidity || 70) + 5;
    }

    // 🌆 Climat urbain
    if (region.includes("Urban") || ["Belgium", "France"].includes(country)) {
      forecast.temperature_max += 0.5;
      forecast.humidity = (forecast.humidity || 70) - 2;
    }

    // 🌊 Influence maritime
    if (region.includes("Coast")) {
      forecast.humidity += 5;
      forecast.reliability = (forecast.reliability || 50) + 3;
    }

    forecast.localAdjust = { elevation, region, country, microfactor: "terrain+urbanisation+climat" };
    await addEngineLog(`🌡️ LocalFactors appliqués (${country} - alt ${elevation} m)`);
    return forecast;
  } catch (err) {
    await addEngineLog(`⚠️ LocalFactors erreur : ${err.message}`);
    return forecast;
  }
}

/**
 * 🔁 Compatibilité ancienne version (superForecast.js)
 * Certaines parties du moteur utilisent encore applyLocalFactors()
 */
export async function applyLocalFactors(forecast, lat, lon, country) {
  return await adjustWithLocalFactors(forecast, lat, lon, "GENERIC", country);
}

// ✅ Export commun
export default { adjustWithLocalFactors, applyLocalFactors };
