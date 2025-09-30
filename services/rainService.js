// services/rainService.js
// 🌧️ Détection pluie / inondations
// Sources : OpenWeather, Copernicus ERA5, relief local

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";  // ✅ intégré

export async function analyzeRain(lat, lon, country, region) {
  try {
    addEngineLog(`🌧️ Analyse pluie pour ${country}${region ? " - " + region : ""}`);

    // OpenWeather (fallback pluie brute)
    let ow = null;
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation`
      );
      ow = res.data;
    } catch {
      addEngineLog("⚠️ OpenMeteo pluie non disponible");
    }

    // Copernicus ERA5 (reanalysis précipitation)
    let copernicus = null;
    try {
      const res = await axios.get(
        `https://cds.climate.copernicus.eu/api/v2/resources/reanalysis-era5-land?lat=${lat}&lon=${lon}`
      );
      copernicus = res.data;
    } catch {
      addEngineLog("⚠️ Copernicus pluie non disponible");
    }

    // Ajustements relief / altitude
    const adj = await applyGeoFactors({}, lat, lon, country);

    return {
      type: "pluie",
      data: { ow, copernicus },
      risk: (ow || copernicus) ? "possible" : "low",
      factors: adj,
    };
  } catch (err) {
    await addEngineError(`Erreur analyse pluie: ${err.message}`);
    return { type: "pluie", error: err.message };
  }
}
