// services/superForecast.js
import meteoManager from "./meteoManager.js";
import openweather from "./openweather.js";
import nasaSat from "./nasaSat.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import comparator from "./comparator.js";

import { applyGeoFactors } from "./geoFactors.js";
import localFactors from "./localFactors.js";
import forecastVision from "./forecastVision.js";

import Forecast from "../models/Forecast.js";

/**
 * Run complet SuperForecast
 */
async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics
    const meteomaticsSources = await meteoManager(lat, lon);

    // 2. Autres sources externes
    const [ow, nasa, trul, wett] = await Promise.allSettled([
      openweather.getForecast?.(lat, lon),
      nasaSat(lat, lon),
      trullemans.getForecast?.(lat, lon),
      wetterzentrale.getForecast?.(lat, lon),
    ]);

    const sources = [
      ...(meteomaticsSources || []),
      ow.value,
      nasa.value,
      trul.value,
      wett.value,
    ].filter(Boolean);

    if (!sources.length) throw new Error("Aucune source météo disponible");

    console.log(`📡 Sources intégrées: ${sources.map(s => s.source).join(", ")}`);

    // 3. Fusion intelligente
    let merged = comparator.mergeForecasts(sources);

    // 4. Ajustements
    merged = applyGeoFactors(merged, lat, lon);
    merged = localFactors.applyLocalFactors(merged, lat, lon);

    // 5. Détection anomalies saisonnières
    merged.anomaly = forecastVision.detectSeasonalAnomaly(merged) || null;

    // 6. Sauvegarde MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown"),
    });
    await forecastDoc.save();

    console.log("✅ SuperForecast sauvegardé en base");

    return { success: true, forecast: merged, sources: sources.map(s => s.source), anomaly: merged.anomaly };
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err.message);
    return { success: false, error: err.message };
  }
}

export default { runFullForecast };
