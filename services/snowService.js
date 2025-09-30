// services/snowService.js
// ❄️ Détection neige / avalanches
// Sources : Skiinfo, Snow-Forecast, Copernicus ERA5, altitude, relief

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";  // ✅ correction

export async function analyzeSnow(lat, lon, country, region) {
  try {
    addEngineLog(`❄️ Analyse neige pour ${country}${region ? " - " + region : ""}`);

    // Skiinfo (stations, neige)
    let skiinfo = null;
    try {
      const res = await axios.get(
        `https://www.skiinfo.fr/json/liftsOpen.php?latitude=${lat}&longitude=${lon}`
      );
      skiinfo = res.data;
    } catch {
      addEngineLog("⚠️ Skiinfo non disponible");
    }

    // Snow-forecast (hauteur neige prévue)
    let snowForecast = null;
    try {
      const res = await axios.get(
        `https://www.snow-forecast.com/maps/json/next3d/snow?lat=${lat}&lon=${lon}`
      );
      snowForecast = res.data;
    } catch {
      addEngineLog("⚠️ Snow-forecast non disponible");
    }

    // Ajustements relief / altitude
    const adj = await applyGeoFactors({}, lat, lon, country);

    return {
      type: "neige",
      data: { skiinfo, snowForecast },
      risk: (skiinfo || snowForecast) ? "possible" : "low",
      factors: adj,
    };
  } catch (err) {
    await addEngineError(`Erreur analyse neige: ${err.message}`);
    return { type: "neige", error: err.message };
  }
}
