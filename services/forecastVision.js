// services/forecastVision.js

/**
 * Détection des anomalies saisonnières sur une prévision
 * Exemple : température trop haute/basse pour la saison
 */
function detectSeasonalAnomaly(forecast) {
  try {
    const { temperature, precipitation } = forecast;

    // Simple exemple d'anomalie (tu pourras enrichir avec Copernicus)
    let anomaly = null;

    if (temperature > 35) {
      anomaly = "🌡️ Canicule détectée";
    } else if (temperature < -15) {
      anomaly = "❄️ Froid extrême détecté";
    }

    if (precipitation > 100) {
      anomaly = anomaly
        ? `${anomaly} + 🌧️ Pluie extrême`
        : "🌧️ Pluie extrême détectée";
    }

    return anomaly;
  } catch (err) {
    console.error("❌ Erreur forecastVision:", err.message);
    return null;
  }
}

export default { detectSeasonalAnomaly };
