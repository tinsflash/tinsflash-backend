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
import { logInfo, logError } from "../utils/logger.js";

/**
 * Run complet SuperForecast
 * Fusionne GFS + ECMWF + ICON (Meteomatics) + autres sources
 * Sauvegarde en MongoDB + détecte anomalies
 */
async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    logInfo(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics (GFS, ECMWF, ICON)
    const meteomaticsSources = await meteoManager(lat, lon);
    logInfo(`✅ Données Meteomatics récupérées (${meteomaticsSources.length})`);

    // 2. Autres sources externes
    const [ow, nasa, trul, wett] = await Promise.allSettled([
      openweather.getForecast(lat, lon),
      nasaSat(lat, lon),
      trullemans.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon),
    ]);

    const sources = [
      ...meteomaticsSources,
      ow.value,
      nasa.value,
      trul.value,
      wett.value,
    ].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source météo disponible");
    }

    logInfo(`📡 Sources intégrées: ${sources.map(s => s.source).join(", ")}`);

    // 3. Fusion intelligente
    let merged = comparator.mergeForecasts(sources);
    logInfo("🔀 Fusion intelligente des modèles effectuée");

    // 4. Ajustements géographiques et locaux
    merged = applyGeoFactors(merged, lat, lon);
    merged = localFactors.applyLocalFactors(merged, lat, lon);
    logInfo("⚙️ Ajustements géographiques et locaux appliqués");

    // 5. Détection anomalies saisonnières
    const anomaly = forecastVision.detectSeasonalAnomaly(merged);
    if (anomaly) {
      logInfo(`⚠️ Anomalie saisonnière détectée: ${JSON.stringify(anomaly)}`);
      merged.anomaly = anomaly;
    }

    // 6. Sauvegarde en MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown"),
    });

    await forecastDoc.save();
    logInfo("✅ SuperForecast sauvegardé en base");

    return {
      success: true,
      forecast: merged,
      sources: sources.map(s => s.source),
      anomaly,
    };
  } catch (err) {
    logError("❌ Erreur SuperForecast: " + err.message);
    return { success: false, error: err.message };
  }
}

export default { runFullForecast };
