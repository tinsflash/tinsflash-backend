// services/superForecast.js
import meteomatics from "../sources/meteomatics.js";
import openweather from "../sources/openweather.js";
import wetterzentrale from "../sources/wetterzentrale.js";
import trullemans from "../sources/trullemans.js";
import iconDwd from "../sources/iconDwd.js";
import comparator from "../sources/comparator.js";

import { applyGeoFactors } from "../services/geoFactors.js";
import { applyLocalFactors } from "../services/localFactors.js";
import { detectSeasonalAnomaly } from "../services/forecastVision.js";

import Forecast from "../models/Forecast.js";

async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    // 📡 Récupération des données brutes
    const [meteoData, openData, wetterData, trulData, iconData] = await Promise.all([
      meteomatics.getForecast(lat, lon),
      openweather.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon),
      trullemans.getForecast(lat, lon),
      iconDwd.getForecast(lat, lon),
    ]);

    const sources = [meteoData, openData, wetterData, trulData, iconData].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source météo disponible");
    }

    // ⚖️ Fusion intelligente
    let merged = comparator.mergeForecasts(sources);

    // 🌍 Ajustements géographiques et locaux
    merged = applyGeoFactors(merged, lat, lon);
    merged = applyLocalFactors(merged, lat, lon);

    // 📊 Détection anomalies saisonnières
    const anomaly = detectSeasonalAnomaly(merged);
    merged.anomaly = anomaly || null;

    // 🔐 Sauvegarde en base Mongo
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown"),
    });

    await forecastDoc.save();

    return {
      success: true,
      forecast: merged,
      sources: sources.length,
      anomaly,
    };
  } catch (err) {
    console.error("❌ Erreur superForecast:", err);
    return { success: false, error: err.message };
  }
}

export default { runFullForecast };
