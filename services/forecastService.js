// services/forecastService.js
import { getMeteomatics } from "../hiddensources/meteomatics.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { adjustWithLocalFactors } from "./localFactors.js";
import { applyTrullemansAdjustments } from "./trullemans.js";
import { applyGeoFactors } from "./geoFactors.js";

/**
 * Fusionne plusieurs sources météo (Meteomatics, OpenWeather, etc.)
 * et applique ensuite les ajustements IA + locaux.
 */
export async function getForecast(lat, lon, country) {
  const results = [];
  const errors = [];

  // ✅ Meteomatics
  const meteomatics = await getMeteomatics(lat, lon);
  if (meteomatics.error) errors.push(meteomatics.error);
  else results.push(meteomatics);

  // ✅ OpenWeather
  const openweather = await getOpenWeather(lat, lon);
  if (openweather.error) errors.push(openweather.error);
  else results.push(openweather);

  // ✅ Combine résultats bruts
  const combined = {
    temperature_min: Math.min(...results.map(r => r.temperature || 0)),
    temperature_max: Math.max(...results.map(r => r.temperature || 0)),
    precipitation: results.map(r => r.precipitation || 0).reduce((a, b) => a + b, 0),
    wind: Math.max(...results.map(r => r.wind || 0)),
    description: results.map(r => r.description || r.source).join(" | "),
    reliability: Math.round(((results.length - errors.length) / (results.length + errors.length || 1)) * 100),
    code: results.length > 0 ? 2 : 0
  };

  // ✅ Corrections locales
  let forecast = adjustWithLocalFactors(combined, country);

  // ✅ Ajustements Trullemans
  forecast = applyTrullemansAdjustments(forecast);

  // ✅ Facteurs géographiques (altitude, mer, rivières…)
  forecast = await applyGeoFactors(forecast, lat, lon);

  return { combined: forecast, errors, successCount: results.length };
}
