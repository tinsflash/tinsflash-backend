// services/superForecast.js
import meteoManager from "./meteoManager.js";
import { getForecast as getOpenWeather } from "./openweather.js";
import nasaSat from "./nasaSat.js";
import { getForecast as getTrullemans } from "./trullemans.js";
import { getForecast as getWetterzentrale } from "./wetterzentrale.js";
import comparator from "./comparator.js";

import { applyGeoFactors } from "./geoFactors.js";
import applyLocalFactors from "./localFactors.js";
import { detectSeasonalAnomaly } from "./forecastVision.js";

import Forecast from "../models/Forecast.js";

/**
 * Run complet SuperForecast
 * Fusionne GFS + ECMWF + ICON (Meteomatics) + autres sources
 * Sauvegarde en MongoDB + détecte anomalies
 */
async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics (GFS, ECMWF, ICON)
    const meteomaticsSources = await meteoManager(lat, lon);

    // 2. Autres sources externes
    const [ow, nasa, trul, wett] = await Promise.all([
      getOpenWeather(lat, lon),
      nasaSat(lat, lon),
      getTrullemans(lat, lon),
      getWetterzentrale(lat, lon),
    ]);

    // 3. Regrouper toutes les sources
    const sources = [
      ...(Array.isArray(meteomaticsSources) ? meteomaticsSources : [meteomaticsSources]),
      ow,
      nasa,
      trul,
      wett,
    ].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source météo disponible");
    }

    console.log(`📡 Sources intégrées: ${sources.map(s => s.source).join(", ")}`);

    // 4. Fusion intelligente
    let merged = comparator.mergeForecasts(sources);

    // 5. Ajustements
    merged = applyGeoFactors(merged, lat, lon);
    merged = applyLocalFactors(merged, lat, lon);

    // 6. Détection anomalies saisonnières
    const anomaly = detectSeasonalAnomaly(merged);
    merged.anomaly = anomaly || null;

    // 7. Sauvegarde MongoDB
    try {
      const forecastDoc = new Forecast({
        timestamp: new Date(),
        location: { lat, lon },
        data: merged,
        sources: sources.map(s => s.source || "unknown"),
      });
      await forecastDoc.save();
      console.log("✅ SuperForecast sauvegardé en base");
    } catch (dbErr) {
      console.error("⚠️ Erreur sauvegarde MongoDB:", dbErr.message);
    }

    return {
      success: true,
      timestamp: new Date(),
      forecast: merged,
      sources: sources.map(s => s.source),
      anomaly,
    };
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err.message);
    return { success: false, error: err.message };
  }
}

export default { runFullForecast };
