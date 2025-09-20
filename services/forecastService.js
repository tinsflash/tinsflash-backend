import { getMeteomatics } from "../hiddensources/meteomatics.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { adjustWithLocalFactors } from "./localFactors.js";
import { applyTrullemansAdjustments } from "./trullemans.js";
import { getNorm } from "../utils/seasonalNorms.js";

export async function getForecast(lat, lon, country) {
  const results = [];
  const errors = [];

  // Meteomatics
  try {
    const meteomatics = await getMeteomatics(lat, lon);
    if (meteomatics.error) errors.push(meteomatics.error);
    else results.push(meteomatics);
  } catch (err) {
    errors.push("Meteomatics: " + err.message);
  }

  // OpenWeather
  try {
    const openweather = await getOpenWeather(lat, lon);
    if (openweather.error) errors.push(openweather.error);
    else results.push(openweather);
  } catch (err) {
    errors.push("OpenWeather: " + err.message);
  }

  // Calcul de base
  const combined = {
    temperature_min: Math.min(...results.map(r => r.temperature ?? 99)),
    temperature_max: Math.max(...results.map(r => r.temperature ?? -99)),
    precipitation: results.map(r => r.precipitation ?? 0).reduce((a, b) => a + b, 0),
    wind: Math.max(...results.map(r => r.wind ?? 0)),
    description: results.map(r => r.description || r.source).join(" | "),
    reliability: Math.round(((results.length - errors.length) / (results.length + errors.length || 1)) * 100),
    code: results.length > 0 ? 2 : 0
  };

  // Ajustements locaux
  adjustWithLocalFactors(combined, country);
  applyTrullemansAdjustments(combined);

  // Normes saisonnières
  const month = new Date().getMonth() + 1;
  const season =
    month <= 2 || month === 12 ? "winter" :
    month <= 5 ? "spring" :
    month <= 8 ? "summer" : "autumn";
  const norm = getNorm(season);

  combined.anomaly = {};
  if (combined.temperature_max > norm.temp_max + 5) {
    combined.anomaly.message = "Anomalie chaleur : températures au-dessus des normales";
  } else if (combined.temperature_min < norm.temp_min - 5) {
    combined.anomaly.message = "Anomalie froid : températures sous les normales";
  }

  return { combined, errors, successCount: results.length };
}
