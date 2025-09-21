// services/forecastVision.js

/**
 * Détection des anomalies saisonnières
 * Analyse les données de prévision et signale les écarts significatifs
 */
function detectSeasonalAnomaly(forecast) {
  try {
    console.log("🔎 Analyse anomalies saisonnières...");

    if (!forecast || !forecast.temperature) {
      return null;
    }

    const avgTemp = (forecast.temperature_min + forecast.temperature_max) / 2;

    // Exemple : si température > 35°C en Europe → anomalie
    if (forecast.location && forecast.location.lat >= 35 && forecast.location.lat <= 60) {
      if (avgTemp > 35) {
        return {
          type: "heatwave",
          severity: "high",
          message: "🌡️ Anomalie détectée : vague de chaleur inhabituelle"
        };
      }
    }

    // Exemple : précipitations > 100 mm/jour → anomalie
    if (forecast.precipitation && forecast.precipitation > 100) {
      return {
        type: "flood_risk",
        severity: "high",
        message: "🌊 Anomalie détectée : précipitations extrêmes"
      };
    }

    return null;
  } catch (err) {
    console.error("❌ Erreur analyse anomalies:", err.message);
    return null;
  }
}

export { detectSeasonalAnomaly };
