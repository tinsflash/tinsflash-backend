// services/rainService.js
// 🌧️ Détection pluie / crues / inondations
// Sources : Copernicus ERA5 (total precipitation) + stations locales

import { addEngineLog, addEngineError } from "./engineState.js";
import copernicus from "./copernicusService.js";

export async function analyzeRain(lat, lon, country, region) {
  try {
    addEngineLog(`🌧️ Analyse pluie pour ${country}${region ? " - " + region : ""}`);

    let copernicusData = null;
    try {
      copernicusData = await copernicus("reanalysis-era5-land", {
        variable: ["total_precipitation"],
        product_type: "reanalysis",
        year: new Date().getUTCFullYear(),
        month: String(new Date().getUTCMonth() + 1).padStart(2, "0"),
        day: String(new Date().getUTCDate()).padStart(2, "0"),
        time: ["00:00", "06:00", "12:00", "18:00"],
        area: [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25],
        format: "json",
      });
    } catch (e) {
      addEngineLog("⚠️ Copernicus précipitations non disponible");
    }

    const riskLevel =
      copernicusData?.precipitation && copernicusData.precipitation > 50
        ? "high"
        : "low";

    return {
      type: "pluie",
      data: copernicusData,
      risk: riskLevel,
    };
  } catch (err) {
    addEngineError(`Erreur analyse pluie: ${err.message}`);
    return { type: "pluie", error: err.message };
  }
}
