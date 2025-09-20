// -------------------------
// 🌍 forecastService.js
// Service de prévisions météo
// ⚠️ Ce fichier délègue maintenant vers le moteur IA multi-modèles
// -------------------------

import { runSuperForecast } from "./superForecast.js";

/**
 * Raccourci pour compatibilité avec l’ancien code
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} country - Code pays
 * @returns {Promise<Object>}
 */
export async function getForecast(lat, lon, country = "BE") {
  try {
    // On appelle directement le super moteur IA
    const forecast = await runSuperForecast(lat, lon, country);

    return {
      combined: forecast.forecast,
      errors: forecast.errors || [],
      sources: forecast.sources || [],
      successCount: forecast.sources ? forecast.sources.length : 0,
    };
  } catch (err) {
    return {
      combined: {
        temperature_min: null,
        temperature_max: null,
        precipitation: null,
        wind: null,
        description: "❌ Erreur moteur IA",
        reliability: 0,
        anomaly: err.message,
      },
      errors: [err.message],
      sources: [],
      successCount: 0,
    };
  }
}
