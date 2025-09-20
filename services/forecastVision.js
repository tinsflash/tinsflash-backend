// services/forecastVision.js
// -------------------------
// 🌍 forecastVision.js
// Comparateur externe des prévisions météo
// -------------------------

import fs from "fs";

const MANUAL_FILE = "./data/manual_forecasts.json";

// Chargement des prévisions manuelles (FB, WhatsApp, etc.)
function loadManualForecasts() {
  try {
    if (fs.existsSync(MANUAL_FILE)) {
      return JSON.parse(fs.readFileSync(MANUAL_FILE, "utf-8"));
    }
    return [];
  } catch (err) {
    return [];
  }
}

// Ajout manuel depuis admin-pp
export function addManualForecast(source, forecast) {
  const data = loadManualForecasts();
  data.push({ source, forecast, timestamp: new Date() });
  fs.writeFileSync(MANUAL_FILE, JSON.stringify(data, null, 2));
  return true;
}

// Fusionner avec les prévisions manuelles
export function mergeWithManual(forecast) {
  const manuals = loadManualForecasts();
  if (manuals.length > 0) {
    forecast.manuals = manuals;
  }
  return forecast;
}

// 📊 Détection d’anomalies saisonnières
export function detectSeasonalAnomaly(forecast) {
  // Exemple simple : détection de conditions extrêmes
  if (forecast.temperature_max > 35) {
    return { type: "heatwave", message: "🌡️ Anomalie : canicule détectée" };
  }
  if (forecast.temperature_min < -10) {
    return { type: "coldwave", message: "❄️ Anomalie : vague de froid détectée" };
  }
  if (forecast.precipitation > 50) {
    return { type: "rain", message: "🌧️ Anomalie : fortes précipitations" };
  }
  return null; // pas d’anomalie détectée
}
