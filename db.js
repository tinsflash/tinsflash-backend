// db.js
import mongoose from "mongoose";
import Forecast from "./models/Forecast.js";
import { logError, logInfo } from "./utils/logger.js";

/**
 * Sauvegarde une prévision météo en base MongoDB
 */
export async function saveForecast(forecastData) {
  try {
    const forecast = new Forecast(forecastData);
    await forecast.save();
    logInfo("✅ Prévision sauvegardée en base");
    return forecast;
  } catch (err) {
    logError("❌ Erreur lors de la sauvegarde forecast: " + err.message);
    throw err;
  }
}

/**
 * Récupère les dernières prévisions
 */
export async function getForecasts(limit = 10) {
  try {
    return await Forecast.find().sort({ timestamp: -1 }).limit(limit);
  } catch (err) {
    logError("❌ Erreur lors de la récupération forecasts: " + err.message);
    throw err;
  }
}
