// services/forecastService.js
import meteoManager from "./meteoManager.js";
import openweather from "./openweather.js";
import nasaSat from "./nasaSat.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import comparator from "./comparator.js";

import { applyGeoFactors } from "./geoFactors.js";
import localFactors from "./localFactors.js";
import { detectSeasonalAnomaly } from "./forecastVision.js";

import Forecast from "../models/Forecast.js";

/**
 * Service de prévisions standard (sans IA avancée)
 * Fusionne quelques sources de base
 */
async function runBasicForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🌍 Lancement ForecastService pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics (via meteoManager)
    const meteomaticsSources = await meteoManager(lat, lon);

    // 2. Autres sources externes (OpenWeather, NASA, Trullemans, Wetterzentrale)
    const [ow, nasa, trul, wett] = await Promise.all([
      openweather.getForecast(lat, lon),
      nasaSat(lat, lon),
      trullemans.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon)
    ]);

    const sources = [...meteomaticsSources, ow, nasa, trul, wett].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source météo disponible (forecastService)");
    }

    console.log(`📡 Sources intégrées (forecastService): ${sources.map(s => s.source).join(", ")}`);

    // 3. Fusion simple
    let merged = comparator.mergeForecasts(sources);

    // 4. Ajustements (facteurs géographiques et locaux)
    merged = applyGeoFactors(merged, lat, lon);
    merged = localFactors.applyLocalFactors(merged, lat, lon);

    // 5. Détection anomalies saisonnières
    const anomaly = detectSeasonalAnomaly(merged);
    merged.anomaly = anomaly || null;

    // 6. Sauvegarde MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown")
    });

    await forecastDoc.save();

    console.log("✅ ForecastService sauvegardé en base");

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

export default { runBasicForecast };
