// services/forecastService.js
import Forecast from "../models/Forecast.js";

/**
 * Récupère la dernière prévision enregistrée en base.
 * Utilisé par la version publique (index, cockpit…).
 */
export async function getLatestForecast() {
  try {
    const last = await Forecast.findOne().sort({ createdAt: -1 });
    if (!last) {
      return { error: "Aucune prévision disponible" };
    }
    return last.forecast;
  } catch (err) {
    return { error: "Erreur DB: " + err.message };
  }
}

/**
 * Récupère les X derniers runs stockés (logs).
 */
export async function getForecastLogs(limit = 10) {
  try {
    return await Forecast.find().sort({ createdAt: -1 }).limit(limit);
  } catch (err) {
    return [{ error: "Erreur DB: " + err.message }];
  }
}
