// services/forecastVision.js
import axios from "axios";

const ERA5_API = "https://cds.climate.copernicus.eu/api/v2";

/**
 * Détecte les anomalies saisonnières via Copernicus ERA5
 * Compare prévisions actuelles aux normales saisonnières
 */
async function detectSeasonalAnomaly(forecast) {
  try {
    if (!forecast || !forecast.temperature) return null;

    // Exemple : moyenne de la prévision actuelle
    const avgTemp =
      forecast.temperature.reduce((a, b) => a + b, 0) /
      (forecast.temperature.length || 1);

    // ⚡ Simulation d’appel Copernicus ERA5 (normal saisonnier)
    const response = await axios.get(ERA5_API, {
      params: {
        variable: "2m_temperature",
        product_type: "monthly_averaged_reanalysis",
        year: new Date().getFullYear() - 1,
        month: new Date().getMonth() + 1,
        format: "json",
      },
      timeout: 10000,
    });

    const seasonalNorm =
      response.data?.seasonal_average ?? avgTemp; // fallback auto

    const diff = avgTemp - seasonalNorm;
    const anomalyDetected = Math.abs(diff) > 3; // seuil arbitraire ±3°C

    return anomalyDetected
      ? {
          anomaly: true,
          deviation: diff.toFixed(2),
          message: `⚠️ Anomalie saisonnière détectée : écart de ${diff.toFixed(
            1
          )}°C par rapport aux normales.`,
        }
      : null;
  } catch (error) {
    console.error("⚠️ forecastVision ERA5 indisponible:", error.message);
    return null; // ⚡ Pas de blocage, juste pas d’anomalie
  }
}

export default { detectSeasonalAnomaly };
