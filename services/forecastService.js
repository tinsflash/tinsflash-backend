// services/forecastService.js
import Forecast from "../models/Forecast.js";
import { addLog } from "./logsService.js";

/**
 * Génère un texte clair pour le bulletin météo local
 */
function generateLocalBulletin(forecast, country) {
  if (!forecast) return "⚠️ Données locales indisponibles.";
  const temp = forecast.temp || "N/A";
  const cond = forecast.condition || "N/A";
  return `Prévisions locales pour aujourd'hui (${country || "zone couverte"}): ${cond}, température moyenne ${temp}°C.`;
}

/**
 * Génère un texte clair pour le bulletin météo national
 */
function generateNationalBulletin(forecast, country) {
  if (!forecast) return "⚠️ Données nationales indisponibles.";
  return `Prévisions nationales (${country}): tendance générale ${forecast.condition}, températures moyennes autour de ${forecast.temp}°C.`;
}

async function getLocalForecast(lat, lon, country = "Europe/USA") {
  try {
    addLog("📍 Récupération prévisions locales...");
    const forecast = await Forecast.findOne().sort({ timestamp: -1 });
    return {
      forecast,
      bulletinLocal: generateLocalBulletin(forecast?.data, country),
    };
  } catch (err) {
    addLog("❌ Erreur getLocalForecast: " + err.message);
    throw err;
  }
}

async function getNationalForecast(country = "Europe/USA") {
  try {
    addLog("🌍 Récupération prévisions nationales...");
    const forecast = await Forecast.findOne().sort({ timestamp: -1 });
    return {
      forecast,
      bulletinNational: generateNationalBulletin(forecast?.data, country),
    };
  } catch (err) {
    addLog("❌ Erreur getNationalForecast: " + err.message);
    throw err;
  }
}

async function get7DayForecast(lat, lon, country = "Europe/USA") {
  try {
    addLog("📅 Récupération prévisions 7 jours...");
    const forecasts = await Forecast.find().sort({ timestamp: -1 }).limit(7);

    const textSummary = forecasts.map((f, i) => {
      return `Jour ${i + 1}: ${f.data.condition}, ${f.data.temp}°C`;
    });

    return {
      forecasts,
      bulletin7days: `Prévisions sur 7 jours (${country}): ${textSummary.join(" | ")}`,
    };
  } catch (err) {
    addLog("❌ Erreur get7DayForecast: " + err.message);
    throw err;
  }
}

/**
 * ✅ Export complet (default + fonctions nommées)
 */
export default {
  getLocalForecast,
  getNationalForecast,
  get7DayForecast
};

export { getLocalForecast, getNationalForecast, get7DayForecast };
