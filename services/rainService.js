// ==========================================================
// 🌧️ TINSFLASH – rainService.js
// v5.15d PRO+++
// Source unique : Open-Meteo (vérifiée)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";

// ==========================================================
// ⚙️ Analyse pluie – IA.J.E.A.N.
// ==========================================================
export async function analyzeRain(lat, lon, country = "EU") {
  try {
    await addEngineLog(`🌧️ Analyse pluie lancée (${lat}, ${lon})`, "info", "rain");

    // 🔗 Source unique (Open-Meteo)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&forecast_days=1`;
    const response = await axios.get(url);
    const data = response.data?.hourly?.precipitation ?? [];

    if (!data.length) {
      await addEngineError("Aucune donnée de pluie reçue (Open-Meteo vide)", "rain");
      return { success: false, error: "Pas de données de précipitations" };
    }

    // 🌍 Facteurs géographiques
    const geo = await applyGeoFactors(lat, lon, country);
    const meanPrecip = data.reduce((a, b) => a + b, 0) / data.length;
    const adjusted = meanPrecip * (geo.precipFactor ?? 1);

    // 💧 Interprétation
    let risk = "☀️ Aucune pluie significative";
    if (adjusted > 10) risk = "🌧️ Pluie forte";
    else if (adjusted > 5) risk = "🌦️ Pluie modérée";
    else if (adjusted > 1) risk = "🌤️ Risque faible";

    await addEngineLog(
      `✅ Pluie analysée (${risk}) – moyenne ${adjusted.toFixed(2)} mm/h`,
      "success",
      "rain"
    );

    return {
      success: true,
      lat,
      lon,
      country,
      avg_precip_mm: adjusted,
      risk,
      reliability: Math.min(1, adjusted / 15),
      source: "Open-Meteo",
    };
  } catch (err) {
    await addEngineError(`Erreur rainService : ${err.message}`, "rain");
    return { success: false, error: err.message };
  }
}

export default { analyzeRain };
