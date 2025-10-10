// ==========================================================
// 🌍 TINSFLASH – localFactors.js (Everest Protocol v3.2 PRO+++)
// ==========================================================
// Analyse topographique & environnementale micro-locale
// Relief, altitude, urbanisation, distance à la mer, forêt, plaine
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

const cache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function applyLocalFactors(forecast, lat = 0, lon = 0, country = "GLOBAL", region = "GENERIC") {
  try {
    if (!forecast) return forecast;
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (cache.has(key)) return cache.get(key);

    // === Relief & altitude ===
    let elevation = 0;
    try {
      const res = await axios.get(`https://api.opentopodata.org/v1/test-dataset?locations=${lat},${lon}`, { timeout: 7000 });
      elevation = res?.data?.results?.[0]?.elevation ?? 0;
    } catch {
      try {
        const res2 = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`, { timeout: 7000 });
        elevation = res2?.data?.results?.[0]?.elevation ?? 0;
      } catch {
        elevation = 0;
        await addEngineLog(`⚠️ Altitude indisponible (${lat},${lon})`, "warn", "localFactors");
      }
    }

    // === Altitude impact ===
    if (elevation > 500) {
      forecast.temperature = (forecast.temperature ?? 15) - (elevation / 1000) * 6.5;
      forecast.humidity = (forecast.humidity ?? 60) + 5;
    }

    // === Urbanisation / Rural ===
    if (region.includes("Urban") || ["Belgium", "France"].includes(country)) {
      forecast.temperature = (forecast.temperature ?? 15) + 0.7;
      forecast.humidity = (forecast.humidity ?? 60) - 3;
    }

    // === Influence maritime (proximité côtière < 100 km) ===
    const nearCoast = lon > -10 && lon < 20 && lat > 35 && lat < 60;
    if (nearCoast) {
      forecast.humidity = (forecast.humidity ?? 60) + 4;
      forecast.reliability = (forecast.reliability ?? 70) + 3;
    }

    // === Forêts tropicales (latitudes < 10° & forte humidité) ===
    if (Math.abs(lat) < 10) {
      forecast.humidity = (forecast.humidity ?? 70) + 10;
      forecast.temperature = (forecast.temperature ?? 25) - 1;
    }

    // === Synthèse micro-locale ===
    forecast.localAdjust = {
      elevation,
      region,
      country,
      factors: ["relief", "urbanisation", "océan", "latitude"],
    };

    cache.set(key, forecast);
    await sleep(150);
    await addEngineLog(`🌡️ Facteurs locaux appliqués (${country}, alt ${elevation} m)`, "info", "localFactors");

    return forecast;
  } catch (err) {
    await addEngineError(`❌ Erreur applyLocalFactors : ${err.message}`, "localFactors");
    return forecast;
  }
}

export default { applyLocalFactors };
