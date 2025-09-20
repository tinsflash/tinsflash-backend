// services/forecastVision.js

import { seasonalNorms } from "../utils/seasonalNorms.js";

// Détection d’anomalies saisonnières
export function detectSeasonalAnomaly(forecast) {
  if (!forecast || !forecast.temperature_max) return null;

  const season = getSeason();
  const norm = seasonalNorms[season];

  if (!norm) return null;

  if (forecast.temperature_max > norm.max + 5) {
    return { type: "chaleur", message: "Anomalie : chaleur exceptionnelle" };
  }
  if (forecast.temperature_min < norm.min - 5) {
    return { type: "froid", message: "Anomalie : froid exceptionnel" };
  }

  return null;
}

// Détection manuelle (déjà présent)
export function addManualForecast(source, forecast) {
  return { source, ...forecast };
}

export function resetManualForecasts() {
  return [];
}

// Utilitaire interne
function getSeason() {
  const m = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(m)) return "winter";
  if ([3, 4, 5].includes(m)) return "spring";
  if ([6, 7, 8].includes(m)) return "summer";
  return "autumn";
}
