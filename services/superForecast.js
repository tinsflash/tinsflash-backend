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

async function runFullForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🚀 Lancement SuperForecast pour lat=${lat}, lon=${lon}`);

    // 1. Meteomatics
    const meteomaticsSources = await meteoManager(lat, lon);
    console.log(`📡 Meteomatics: ${meteomaticsSources?.length || 0} sources`);

    // 2. Autres sources
    let [ow, nasa, trul, wett] = await Promise.allSettled([
      openweather.getForecast(lat, lon),
      nasaSat(lat, lon),
      trullemans.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon),
    ]);

    ow = ow.status === "fulfilled" ? ow.value : null;
    nasa = nasa.status === "fulfilled" ? nasa.value : null;
    trul = trul.status === "fulfilled" ? trul.value : null;
    wett = wett.status === "fulfilled" ? wett.value : null;

    console.log("🌍 Résultats intégration :");
    console.log(`   OpenWeather: ${ow ? "OK" : "FAIL"}`);
    console.log(`   NASA: ${nasa ? "OK" : "FAIL"}`);
    console.log(`   Trullemans: ${trul ? "OK" : "FAIL"}`);
    console.log(`   Wetterzentrale: ${wett ? "OK" : "FAIL"}`);

    const sources = [...(meteomaticsSources || []), ow, nasa, trul, wett].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source météo disponible");
    }

    // 3. Fusion
    let merged = comparator.mergeForecasts(sources);

    // 4. Ajustements
    merged = applyGeoFactors(merged, lat, lon);
    merged = localFactors.applyLocalFactors(merged, lat, lon);

    // 5. Détection anomalies
    const anomaly = forecastVision.detectSeasonalAnomaly(merged);
    merged.anomaly = anomaly || null;

    // 6. Sauvegarde MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown"),
    });

    await forecastDoc.save();

    console.log("✅ SuperForecast sauvegardé en base");

    return {
      success: true,
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
