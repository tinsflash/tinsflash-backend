// services/forecastService.js
import Forecast from "../models/Forecast.js";
import { addLog } from "./logsService.js";

// ==============================
// 🌍 Zones couvertes : Europe élargie + UK + Ukraine + USA
// ==============================
const COVERED_EUROPE = [
  "DE", "AT", "BE", "BG", "CY", "HR", "DK", "ES", "EE", "FI", "FR", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "CZ", "RO", "SK", "SI", "SE"
];
const EXTRA_COVERED = ["UK", "UA"]; // Royaume-Uni, Ukraine
const COVERED_USA = ["USA"]; // gestion spéciale par États

/**
 * Génère un résumé météo (tendance + icône)
 */
function generateSummary(min, max, rainProbability, windSpeed) {
  let summary = "";
  let icon = "☀️";

  if (rainProbability > 70) {
    summary = "Journée pluvieuse avec risques élevés de précipitations.";
    icon = "🌧️";
  } else if (rainProbability > 40) {
    summary = "Temps instable avec averses possibles.";
    icon = "🌦️";
  } else if (max >= 30) {
    summary = "Chaleur marquée, temps ensoleillé.";
    icon = "☀️🔥";
  } else if (max <= 0) {
    summary = "Froid intense, risques de neige/verglas.";
    icon = "❄️";
  } else if (windSpeed >= 70) {
    summary = "Rafales violentes attendues, prudence.";
    icon = "🌬️";
  } else {
    summary = "Temps globalement calme et variable.";
    icon = "⛅";
  }

  return { summary, icon };
}

/**
 * Sauvegarde une prévision en base
 */
async function saveForecast({ country, date, minTemp, maxTemp, rainProbability, windSpeed }) {
  const { summary, icon } = generateSummary(minTemp, maxTemp, rainProbability, windSpeed);

  const forecast = new Forecast({
    country,
    date,
    minTemp,
    maxTemp,
    rainProbability,
    windSpeed,
    summary,
    icon,
  });

  await forecast.save();
  return forecast;
}

/**
 * Récupère les prévisions pour un pays ou une zone
 */
export async function getForecast(countryCode) {
  try {
    await addLog(`📡 Récupération prévisions pour ${countryCode}`);

    let forecasts;

    // 🇺🇸 États-Unis → par État + national
    if (countryCode === "USA") {
      forecasts = await Forecast.find({ country: { $regex: "^USA" } }).sort({ date: -1 });
      return forecasts;
    }

    // 🇫🇷 France → multi-zones
    if (countryCode === "FR") {
      const zones = ["FR-NO", "FR-NE", "FR-SO", "FR-SE", "FR-COR"];
      forecasts = await Forecast.find({ country: { $in: zones } }).sort({ date: -1 });
      return forecasts;
    }

    // 🌍 Europe élargie + UK + Ukraine
    if ([...COVERED_EUROPE, ...EXTRA_COVERED].includes(countryCode)) {
      forecasts = await Forecast.find({ country: countryCode }).sort({ date: -1 });
      return forecasts;
    }

    // 🌐 Zones non couvertes (reste du monde)
    forecasts = await Forecast.find({ country: countryCode }).sort({ date: -1 });
    if (!forecasts || forecasts.length === 0) {
      await addLog(`⚠️ Zone non couverte → ${countryCode}, prévisions simplifiées.`);
      return [
        {
          country: countryCode,
          date: new Date().toISOString().split("T")[0],
          minTemp: null,
          maxTemp: null,
          summary: "Prévisions simplifiées (zone non couverte).",
          icon: "🌍",
        },
      ];
    }

    return forecasts;
  } catch (err) {
    console.error("❌ Erreur getForecast:", err.message);
    throw err;
  }
}

/**
 * Injection des données météo (externe → Mongo)
 */
export async function injectForecasts(forecastData) {
  try {
    await addLog("💾 Injection des prévisions en base…");

    const results = [];
    for (const entry of forecastData) {
      const saved = await saveForecast(entry);
      results.push(saved);
    }

    await addLog("✅ Prévisions sauvegardées avec succès");
    return results;
  } catch (err) {
    console.error("❌ Erreur injectForecasts:", err.message);
    throw err;
  }
}

/**
 * ➕ Nouvelles fonctions nécessaires pour bulletinService
 */

// Locale (commune/zone)
export async function getLocalForecast(zone) {
  return getForecast(zone);
}

// Nationale (pays entier)
export async function getNationalForecast(country) {
  return getForecast(country);
}

// 7 jours
export async function get7DayForecast(zone) {
  const forecasts = await getForecast(zone);
  return forecasts.slice(0, 7);
}

export default {
  getForecast,
  injectForecasts,
  getLocalForecast,
  getNationalForecast,
  get7DayForecast,
};
