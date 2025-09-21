// === SOURCES BRUTES (hiddensources) ===
import openweather from "../hiddensources/openweather.js";
import meteomatics from "../hiddensources/meteomatics.js";
import iconDwd from "../hiddensources/iconDwd.js";
import trullemans from "../hiddensources/trullemans.js";
import wetterzentrale from "../hiddensources/wetterzentrale.js";

// === SERVICES MÉTÉO (services) ===
import comparator from "./comparator.js";
import geoFactors from "./geoFactors.js";
import localFactors from "./localFactors.js";
import forecastVision from "./forecastVision.js";
import copernicusService from "./copernicusService.js";

// === MODELS ===
import Forecast from "../models/Forecast.js";

async function runSuperForecast(lat = 50.5, lon = 4.7) {
  try {
    console.log(`🚀 SuperForecast lancé pour lat=${lat}, lon=${lon}`);

    // 1. 📡 Collecte des données brutes
    const [ow, mm, icon, trull, wzt, copernicus] = await Promise.all([
      openweather.getForecast(lat, lon),
      meteomatics.getForecast(lat, lon),
      iconDwd.getForecast(lat, lon),
      trullemans.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon),
      copernicusService.getForecast(lat, lon)
    ]);

    const sources = [ow, mm, icon, trull, wzt, copernicus].filter(Boolean);

    if (!sources.length) {
      throw new Error("❌ Aucune source météo disponible");
    }

    console.log(`✅ ${sources.length} sources collectées`);

    // 2. ⚖️ Fusion des prévisions
    let merged = comparator.mergeForecasts(sources);
    console.log("✅ Fusion effectuée");

    // 3. 🌍 Ajustements géographiques
    merged = geoFactors.applyGeoFactors(merged, lat, lon);
    console.log("✅ Facteurs géographiques appliqués");

    // 4. 🏘 Ajustements locaux
    merged = localFactors.applyLocalFactors(merged, lat, lon);
    console.log("✅ Facteurs locaux appliqués");

    // 5. 📊 Détection anomalies saisonnières (Copernicus ERA5)
    const anomaly = await forecastVision.detectSeasonalAnomaly(lat, lon, merged);
    merged.anomaly = anomaly || null;
    if (anomaly) {
      console.log("⚠️ Anomalie détectée:", anomaly);
    }

    // 6. 🗄 Sauvegarde MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map((s) => s.source || "unknown"),
    });

    await forecastDoc.save();
    console.log("💾 Sauvegarde en base réussie");

    // 7. ✅ Retour final
    return {
      success: true,
      forecast: merged,
      sources: sources.length,
      anomaly,
    };
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err);
    return { success: false, error: err.message };
  }
}

export default { runSuperForecast };
