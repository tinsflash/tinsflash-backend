// services/snowService.js
// ❄️ Détection neige / avalanches
// Sources : Skiinfo, Snow-Forecast, Copernicus ERA5, altitude, relief

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import geoFactors from "./geoFactors.js";

export async function analyzeSnow(lat, lon, country, region) {
  try {
    addEngineLog(`❄️ Analyse neige pour ${country}${region ? " - " + region : ""}`);

    // Skiinfo (bulletins neige)
    let skiinfo = null;
    try {
      const res = await axios.get(
        `https://www.skiinfo.fr/json/liftsOpen.php?latitude=${lat}&longitude=${lon}`
      );
      skiinfo = res.data;
    } catch (e) {
      addEngineLog("⚠️ Skiinfo non disponible");
    }

    // Snow-forecast (hauteur neige prévue)
    let snowForecast = null;
    try {
      const res = await axios.get(
        `https://www.snow-forecast.com/maps/json/next3d/snow?lat=${lat}&lon=${lon}`
      );
      snowForecast = res.data;
    } catch (e) {
      addEngineLog("⚠️ Snow-Forecast non disponible");
    }

    // Ajustement altitude / relief
    const adj = await geoFactors.applyGeoFactors({}, lat, lon);

    return {
      type: "neige",
      data: { skiinfo, snowForecast },
      risk: (skiinfo || snowForecast) ? "possible" : "low",
      factors: adj,
    };
  } catch (err) {
    addEngineError(`Erreur analyse neige: ${err.message}`);
    return { type: "neige", error: err.message };
  }
}
