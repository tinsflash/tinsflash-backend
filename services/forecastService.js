// services/forecastService.js
import meteoManager from "./meteoManager.js";
import openweather from "./openweather.js";
import nasaSat from "./nasaSat.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import comparator from "./comparator.js";

import geoFactors from "./geoFactors.js";
import localFactors from "./localFactors.js";
import forecastVision from "./forecastVision.js";

import Forecast from "../models/Forecast.js";

/**
 * Service principal de prévision météo
 * Fusionne plusieurs sources et applique corrections IA
 */
async function runForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🌍 Lancement ForecastService pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics (via meteoManager)
    const meteomaticsSources = await meteoManager(lat, lon);

    // 2. Autres sources externes
    const [ow, nasa, trul, wett] = await Promise.all([
      openweather.getForecast(lat, lon),
      nasaSat(lat, lon),
      trullemans.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon)
    ]);

    const sources = [...meteomaticsSources, ow, nasa, trul, wett].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source météo disponible");
    }

    console.log(`📡 Sources intégrées: ${sources.map(s => s.source).join(", ")}`);

    // 3. Fusion intelligente
    let merged = comparator.mergeForecasts(sources);

    // 4. Ajustements (géographiques + locaux)
    merged = geoFactors.applyGeoFactors(merged, lat, lon);
    merged = localFactors.applyLocalFactors(merged, lat, lon);

    // 5. Détection anomalies saisonnières
    const anomaly = forecastVision.detectSeasonalAnomaly(merged);
    merged.anomaly = anomaly || null;

    // 6. Sauvegarde MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown")
    });

    await forecastDoc.save();

    console.log("✅ Forecast sauvegardé en base");

    return {
      success: true,
      forecast: merged,
      sources: sources.map(s => s.source),
      anomaly
    };
  } catch (err) {
    console.error("❌ Erreur ForecastService:", err.message);
    return { success: false, error: err.message };
  }
}

export default { runForecast };
