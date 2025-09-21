// src/services/superForecast.js

import meteomatics from "../hiddensources/meteomatics.js";
import openweather from "../hiddensources/openweather.js";
import iconDwd from "../hiddensources/iconDwd.js";
import wetterzentrale from "../hiddensources/wetterzentrale.js";
import trullemans from "../services/trullemans.js";

import comparator from "../hiddensources/comparator.js";
import geoFactors from "../services/geoFactors.js";
import localFactors from "../services/localFactors.js";
import forecastVision from "../services/forecastVision.js"; // anomalies Copernicus

// Fonction principale SuperForecast
async function runSuperForecast(lat, lon) {
  try {
    // 📥 1. Récupérer les prévisions de chaque source
    const [meteo, owm, icon, wz, tru] = await Promise.all([
      meteomatics.getForecast(lat, lon),
      openweather.getForecast(lat, lon),
      iconDwd.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon),
      trullemans.getForecast(lat, lon),
    ]);

    // 🧮 2. Fusion des modèles
    let mergedForecast = comparator.mergeForecasts([meteo, owm, icon, wz, tru]);

    // 🌍 3. Ajustements géographiques
    mergedForecast = geoFactors.applyGeoFactors(lat, lon, mergedForecast);

    // 🏘️ 4. Ajustements locaux
    mergedForecast = localFactors.adjustWithLocalFactors(lat, lon, mergedForecast);

    // 🚨 5. Détection d’anomalies saisonnières via Copernicus
    const anomaly = await forecastVision.detectSeasonalAnomaly(
      lat,
      lon,
      "2m_temperature"
    );

    // Ajouter anomalies au résultat final
    mergedForecast.anomalies = anomaly;

    // ✅ Retourner l’objet complet
    return {
      location: { lat, lon },
      timestamp: new Date(),
      sources: { meteo, owm, icon, wz, tru },
      mergedForecast,
    };
  } catch (error) {
    console.error("Erreur SuperForecast:", error);
    throw error;
  }
}

export default { runSuperForecast };
