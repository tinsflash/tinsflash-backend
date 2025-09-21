// services/forecastVision.js

/**
 * Détection des anomalies saisonnières
 * Compare les prévisions avec les moyennes attendues
 */
function detectSeasonalAnomaly(forecast) {
  try {
    console.log("🔎 Analyse anomalies saisonnières");

    if (!forecast || !forecast.temperature) {
      return null;
    }

    const avgTemp = forecast.temperature.reduce((a, b) => a + b, 0) / forecast.temperature.length;
    const seasonalNorm = 15; // ⚠️ simplifié, à remplacer par Copernicus

    const anomaly = avgTemp - seasonalNorm;

    return {
      type: anomaly > 2 ? "Chaud" : anomaly < -2 ? "Froid" : "Normal",
      value: anomaly.toFixed(2),
    };
  } catch (err) {
    console.error("❌ Erreur detectSeasonalAnomaly:", err.message);
    return null;
  }
}

export default { detectSeasonalAnomaly };
