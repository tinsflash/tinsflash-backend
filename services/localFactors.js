// services/localFactors.js
// 🌍 Ajustement des prévisions selon les facteurs locaux (relief, mer, climat urbain, etc.)

import fetch from "node-fetch";
import { addEngineLog } from "./engineState.js";

/**
 * Ajuste les prévisions météo selon des facteurs locaux :
 * - relief
 * - proximité de la mer
 * - climat urbain
 * - anomalies régionales (à enrichir)
 */
export async function adjustWithLocalFactors(forecast, lat = 0, lon = 0, region = "GENERIC", country = "GLOBAL") {
  try {
    if (!forecast) return forecast;

    // 🌄 Relief : correction selon altitude (via API Open-Elevation)
    let elevation = 0;
    try {
      const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
      elevation = (await res.json())?.results?.[0]?.elevation ?? 0;
    } catch {
      elevation = 0;
    }

    // 🏔️ Ajustement température & humidité selon altitude
    if (elevation > 400) {
      forecast.temperature_min -= 2;
      forecast.temperature_max -= 2;
      forecast.humidity = (forecast.humidity || 70) + 5;
    }

    // 🌆 Microclimat urbain
    if (region.includes("Urban") || ["Belgium", "France"].includes(country)) {
      forecast.temperature_max += 0.5;
      forecast.humidity = (forecast.humidity || 70) - 2;
    }

    // 🌊 Proximité maritime
    if (region.includes("Coast")) {
      forecast.humidity += 5;
      forecast.reliability = (forecast.reliability || 50) + 3;
    }

    // 🧠 Enrichissement de l’objet
    forecast.localAdjust = {
      elevation,
      region,
      country,
      microfactor: "terrain+urbanisation+climat"
    };

    await addEngineLog(`🌡️ adjustWithLocalFactors appliqué (${country} - alt ${elevation} m)`);
    return forecast;
  } catch (err) {
    await addEngineLog(`⚠️ adjustWithLocalFactors erreur : ${err.message}`);
    return forecast;
  }
}

// ✅ Compatibilité CommonJS / ES modules
export default { adjustWithLocalFactors };
