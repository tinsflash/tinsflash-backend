// services/forecastService.js
import Forecast from "../models/Forecast.js";
import { addLog } from "./logsService.js";

/**
 * Génère un texte clair pour le bulletin météo local
 */
function generateLocalBulletin(forecast, country) {
  if (!forecast) {
    addLog("⚠️ Aucune donnée disponible pour le bulletin local");
    return "⚠️ Données locales indisponibles.";
  }

  const temp = forecast.temp ?? "N/A";
  const cond = forecast.condition ?? "N/A";

  return `Prévisions locales pour aujourd'hui (${country || "zone couverte"}): ${cond}, température moyenne ${temp}°C.`;
}

/**
 * Génère un texte clair pour le bulletin météo national
 */
function generateNationalBulletin(forecast, country) {
  if (!forecast) {
    addLog("⚠️ Aucune donnée disponible pour le bulletin national");
    return "⚠️ Données nationales indisponibles.";
  }

  return `Prévisions nationales (${country}): tendance générale ${forecast.condition}, températures moyennes autour de ${forecast.temp}°C.`;
}

/**
 * 📍 Prévisions locales
 */
async function getLocalForecast(lat, lon, country = "Europe/USA") {
  try {
    addLog(`📍 Récupération prévisions locales pour lat=${lat}, lon=${lon}`);
    const forecast = await Forecast.findOne().sort({ timestamp: -1 });

    if (!forecast) {
      addLog("⚠️ Aucune donnée locale trouvée en base");
      return {
        forecast: null,
        bulletinLocal: "⚠️ Données locales indisponibles.",
      };
    }

    addLog("✅ Prévisions locales récupérées avec succès");
    return {
      forecast,
      bulletinLocal: generateLocalBulletin(forecast?.data, country),
    };
  } catch (err) {
    addLog("❌ Erreur getLocalForecast: " + err.message);
    throw err;
  }
}

/**
 * 🌍 Prévisions nationales
 */
async function getNationalForecast(country = "Europe/USA") {
  try {
    addLog(`🌍 Récupération prévisions nationales pour ${country}`);
    const forecast = await Forecast.findOne().sort({ timestamp: -1 });

    if (!forecast) {
      addLog("⚠️ Aucune donnée nationale trouvée en base");
      return {
        forecast: null,
        bulletinNational: "⚠️ Données nationales indisponibles.",
      };
    }

    addLog("✅ Prévisions nationales récupérées avec succès");
    return {
      forecast,
      bulletinNational: generateNationalBulletin(forecast?.data, country),
    };
  } catch (err) {
    addLog("❌ Erreur getNationalForecast: " + err.message);
    throw err;
  }
}

/**
 * 📅 Prévisions 7 jours
 */
async function get7DayForecast(lat, lon, country = "Europe/USA") {
  try {
    addLog(`📅 Récupération prévisions 7 jours pour lat=${lat}, lon=${lon}`);
    const forecasts = await Forecast.find().sort({ timestamp: -1 }).limit(7);

    if (!forecasts.length) {
      addLog("⚠️ Aucune donnée 7 jours trouvée en base");
      return {
        forecasts: [],
        bulletin7days: "⚠️ Données 7 jours indisponibles.",
      };
    }

    const textSummary = forecasts.map((f, i) => {
      return `Jour ${i + 1}: ${f.data.condition || "N/A"}, ${f.data.temp ?? "N/A"}°C`;
    });

    addLog("✅ Prévisions 7 jours récupérées avec succès");
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
  get7DayForecast,
};

export { getLocalForecast, getNationalForecast, get7DayForecast };
