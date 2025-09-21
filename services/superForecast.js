// services/superForecast.js
import meteoManager from "./meteoManager.js";
import openweather from "./openweather.js";
import nasaSat from "./nasaSat.js"; // ✅ import direct de la fonction
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import comparator from "./comparator.js";

import { applyGeoFactors } from "./geoFactors.js";
import localFactors from "./localFactors.js";
import forecastVision from "./forecastVision.js";

import Forecast from "../models/Forecast.js";

/**
 * Run complet SuperForecast
 * Fusionne GFS + ECMWF + ICON (Meteomatics) + autres sources
 * Sauvegarde en MongoDB + détecte anomalies
 */
async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🚀 [RUN] SuperForecast lancé pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics
    console.log("📡 [INFO] Appel Meteomatics (GFS, ECMWF, ICON)...");
    const meteomaticsSources = await meteoManager(lat, lon);
    console.log("✅ [OK] Meteomatics reçu");

    // 2. Autres sources externes
    console.log("📡 [INFO] Appel OpenWeather, NASA POWER, Trullemans, Wetterzentrale...");
    const [ow, nasa, trul, wett] = await Promise.all([
      openweather.getForecast(lat, lon).then(r => { console.log("✅ [OK] OpenWeather reçu"); return r; }),
      nasaSat(lat, lon).then(r => { console.log("✅ [OK] NASA POWER reçu"); return r; }),
      trullemans.getForecast(lat, lon).then(r => { console.log("✅ [OK] Trullemans reçu"); return r; }),
      wetterzentrale.getForecast(lat, lon).then(r => { console.log("✅ [OK] Wetterzentrale reçu"); return r; }),
    ]);

    const sources = [...meteomaticsSources, ow, nasa, trul, wett].filter(Boolean);

    if (!sources.length) {
      throw new Error("❌ Aucune source météo disponible");
    }

    console.log(`📊 [INFO] Sources intégrées: ${sources.map(s => s.source).join(", ")}`);

    // 3. Fusion intelligente
    console.log("🔀 [INFO] Fusion intelligente des modèles...");
    let merged = comparator.mergeForecasts(sources);
    console.log("✅ [OK] Fusion terminée");

    // 4. Ajustements géographiques et locaux
    console.log("🌍 [INFO] Application des facteurs géographiques...");
    merged = applyGeoFactors(merged, lat, lon);
    console.log("✅ [OK] Facteurs géographiques appliqués");

    console.log("🏘️ [INFO] Application des facteurs locaux...");
    merged = localFactors.applyLocalFactors(merged, lat, lon);
    console.log("✅ [OK] Facteurs locaux appliqués");

    // 5. Détection anomalies saisonnières
    console.log("🔎 [INFO] Détection des anomalies saisonnières...");
    const anomaly = forecastVision.detectSeasonalAnomaly(merged);
    if (anomaly) {
      console.log("⚠️ [ALERTE] Anomalie détectée:", anomaly);
    } else {
      console.log("✅ [OK] Pas d’anomalie détectée");
    }
    merged.anomaly = anomaly || null;

    // 6. Sauvegarde en MongoDB
    console.log("💾 [INFO] Sauvegarde dans MongoDB...");
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown"),
    });

    await forecastDoc.save();
    console.log("✅ [OK] SuperForecast sauvegardé en base");

    return {
      success: true,
      forecast: merged,
      sources: sources.map(s => s.source),
      anomaly,
    };
  } catch (err) {
    console.error("❌ [ERREUR SuperForecast]:", err.message);
    return { success: false, error: err.message };
  }
}

export default { runFullForecast };
