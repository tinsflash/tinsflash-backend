// ==========================================================
// ❄️ TINSFLASH – snowService.js
// v5.15e PRO+++
// Détection neige / avalanches
// Sources : Open-Meteo (standard + AROME 2km), altitude, relief
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";

// ==========================================================
// ⚙️ Analyse neige – IA.J.E.A.N.
// ==========================================================
export async function analyzeSnow(lat, lon, country = "EU", region = null) {
  try {
    await addEngineLog(
      `❄️ Analyse neige pour ${country}${region ? " - " + region : ""}`,
      "info",
      "snow"
    );

    // 🌍 Facteurs géographiques (relief, altitude, climat)
    const geo = await applyGeoFactors(lat, lon, country);
    const altitude = geo.altitude ?? 0;

    // 🔗 Choix du modèle
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=snowfall,precipitation&forecast_days=1`;

    // Mode montagne : modèle AROME 2 km si altitude > 1500 m
    if (altitude > 1500 || (region && /ALP|PYR|CARP|ROCK/i.test(region))) {
      url = `https://api.open-meteo.com/v1/arome?latitude=${lat}&longitude=${lon}&hourly=snowfall,precipitation&forecast_days=1`;
      await addEngineLog("🏔️ Passage en mode haute montagne (AROME 2 km)", "info", "snow");
    }

    const res = await axios.get(url);
    const snowData = res.data?.hourly?.snowfall ?? [];
    const precipData = res.data?.hourly?.precipitation ?? [];

    if (!snowData.length && !precipData.length) {
      await addEngineError("Aucune donnée neige reçue (Open-Meteo vide)", "snow");
      return { success: false, error: "Pas de données de neige disponibles" };
    }

    // 📊 Moyennes brutes
    const meanSnow = snowData.reduce((a, b) => a + b, 0) / snowData.length;
    const meanPrecip = precipData.reduce((a, b) => a + b, 0) / precipData.length;

    // 🧮 Ajustement environnemental
    const adjusted = (meanSnow + meanPrecip * 0.3) * (geo.snowFactor ?? 1);

    // ❄️ Interprétation scientifique
    let risk = "☀️ Aucun risque de neige";
    if (adjusted > 20) risk = "🌨️ Chute de neige abondante / avalanche possible";
    else if (adjusted > 10) risk = "🌧️ Neige modérée probable";
    else if (adjusted > 3) risk = "🌦️ Neige faible ou pluie/neige";

    await addEngineLog(
      `✅ Neige analysée (${risk}) – moyenne ${adjusted.toFixed(2)} mm (${altitude} m)`,
      "success",
      "snow"
    );

    return {
      success: true,
      lat,
      lon,
      country,
      altitude,
      avg_snow_mm: adjusted,
      risk,
      reliability: Math.min(1, adjusted / 25),
      model: altitude > 1500 ? "AROME-2km" : "GFS-OpenMeteo",
      source: "Open-Meteo",
    };
  } catch (err) {
    await addEngineError(`Erreur snowService : ${err.message}`, "snow");
    return { success: false, error: err.message };
  }
}

export default { analyzeSnow };
