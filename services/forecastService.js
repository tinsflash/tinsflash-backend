// services/forecastService.js
import Forecast from "../models/Forecast.js";

async function saveNationalForecast(country, zones, text, icon) {
  try {
    const forecast = new Forecast({
      country,
      zones,
      text,
      icon,
      createdAt: new Date()
    });
    await forecast.save();
    console.log(`✅ Prévision sauvegardée pour ${country}`);
  } catch (err) {
    console.error("❌ Erreur sauvegarde forecast :", err.message);
  }
}

async function getLatestForecast(country) {
  try {
    return Forecast.findOne({ country }).sort({ createdAt: -1 }).lean();
  } catch (err) {
    console.error("❌ Erreur récupération forecast :", err.message);
    return null;
  }
}

export default { saveNationalForecast, getLatestForecast };
