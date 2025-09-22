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
import { addLog } from "./logsService.js";

/**
 * Run complet SuperForecast
 */
async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    addLog(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // 1. Sources Meteomatics
    addLog("📡 Récupération des données Meteomatics (GFS, ECMWF, ICON)...");
    const meteomaticsSources = await meteoManager(lat, lon);

    // 2. Autres sources externes
    addLog("🌍 Récupération des autres sources (OpenWeather, NASA, Trullemans, Wetterzentrale)...");
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

    if (!sources.length) {
      throw new Error("Aucune source météo disponible");
    }

    addLog(`✅ Sources intégrées: ${sources.map(s => s.source).join(", ")}`);

    // 3. Fusion intelligente
    addLog("🔄 Fusion des prévisions avec l’IA...");
    let merged = comparator.mergeForecasts(sources);

    // 4. Ajustements géographiques + locaux
    addLog("⛰️ Application des ajustements géographiques...");
    merged = applyGeoFactors(merged, lat, lon);

    addLog("🏘️ Application des ajustements locaux...");
    merged = localFactors.applyLocalFactors(merged, lat, lon);

    // 5. Détection anomalies saisonnières
    addLog("🔍 Détection des anomalies saisonnières (Copernicus ERA5)...");
    merged.anomaly = forecastVision.detectSeasonalAnomaly(merged) || null;

    if (merged.anomaly) {
      addLog(`⚠️ Anomalie détectée: ${JSON.stringify(merged.anomaly)}`);
    } else {
      addLog("✅ Aucune anomalie détectée");
    }

    // 6. Sauvegarde MongoDB
    addLog("💾 Sauvegarde du SuperForecast en base de données...");
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown"),
    });
    await forecastDoc.save();
    addLog("📌 SuperForecast sauvegardé en base");

    addLog("🎯 Run terminé avec succès");

    return {
      success: true,
      forecast: merged,
      sources: sources.map(s => s.source),
      anomaly: merged.anomaly,
    };
  } catch (err) {
    addLog("❌ Erreur SuperForecast: " + err.message);
    console.error("❌ Erreur SuperForecast:", err.message);
    return { success: false, error: err.message };
  }
}

export default { runFullForecast };
