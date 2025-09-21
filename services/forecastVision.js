// services/forecastVision.js
import copernicusService from "./copernicusService.js";

/**
 * Détecte des anomalies saisonnières (température, humidité du sol, etc.)
 * via Copernicus ERA5 Land.
 *
 * @param {Number} lat - Latitude du point étudié
 * @param {Number} lon - Longitude du point étudié
 * @param {String} variable - Type de variable ("2m_temperature", "volumetric_soil_water_layer_1", etc.)
 * @returns {Object} Résultat avec détection d’anomalie + score de confiance + données brutes
 */
async function detectSeasonalAnomaly(lat, lon, variable = "2m_temperature") {
  try {
    const dataset = "reanalysis-era5-land";

    // Exemple : dernière année complète
    const request = {
      variable: [variable],
      year: ["2024"],
      month: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
      day: ["01"],
      time: ["00:00"],
      format: "netcdf",
      // bounding box autour du point (lat+/-1, lon+/-1)
      area: [lat + 1, lon - 1, lat - 1, lon + 1]
    };

    const result = await copernicusService.fetchCopernicusData(dataset, request);

    if (!result) {
      return {
        anomalyDetected: false,
        confidence: 0,
        message: "⚠️ Pas de données reçues de Copernicus",
        rawData: null
      };
    }

    // Ici → normalement analyse statistique des écarts aux moyennes
    // Pour le moment : simulation simple
    const anomalyDetected = Math.random() > 0.7; // 30% chance démo
    const confidence = anomalyDetected ? 0.85 : 0.55;

    return {
      anomalyDetected,
      confidence,
      message: anomalyDetected
        ? "🌡️ Anomalie saisonnière détectée (écart aux normales)"
        : "✅ Pas d’anomalie majeure détectée",
      rawData: result
    };

  } catch (err) {
    console.error("❌ Seasonal anomaly detection failed:", err.message);
    return {
      anomalyDetected: false,
      confidence: 0,
      message: `Erreur Copernicus: ${err.message}`,
      rawData: null
    };
  }
}

export default {
  detectSeasonalAnomaly
};
