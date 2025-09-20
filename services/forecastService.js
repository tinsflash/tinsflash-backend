import { getMeteomatics } from "../hiddensources/meteomatics.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { compareSources } from "../hiddensources/comparator.js";
import { adjustWithLocalFactors } from "./localFactors.js";
import { applyTrullemansAdjustments } from "./trullemans.js";
import { getNorm } from "../utils/seasonalNorms.js";

function analyseFiabilite(results, errors) {
  let score = (results.length / (results.length + errors.length + 1)) * 100;

  // Bonus si sources concordent
  const temps = results.map(r => r.temperature).filter(Boolean);
  if (temps.length > 1) {
    const ecart = Math.max(...temps) - Math.min(...temps);
    if (ecart < 2) score += 10; // concordance = +fiabilité
    if (ecart > 8) score -= 15; // gros écart = -fiabilité
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getForecast(lat, lon, country = "BE") {
  const results = [];
  const errors = [];

  // OpenWeather
  const ow = await getOpenWeather(lat, lon);
  ow.error ? errors.push(ow.error) : results.push(ow);

  // Meteomatics
  const meteo = await getMeteomatics(lat, lon);
  meteo.error ? errors.push(meteo.error) : results.push(meteo);

  // Open-Meteo (backup comparator)
  const cmp = await compareSources(lat, lon);
  cmp.error ? errors.push(cmp.error) : results.push(cmp);

  // Fusion brute
  const combined = {
    temperature_min: Math.min(...results.map(r => r.temperature ?? 99)),
    temperature_max: Math.max(...results.map(r => r.temperature ?? -99)),
    precipitation: results.map(r => r.precipitation || 0).reduce((a, b) => a + b, 0),
    wind: Math.max(...results.map(r => r.wind || 0)),
    description: results.map(r => r.description || r.source).join(" | "),
  };

  // Application des ajustements locaux
  let adjusted = adjustWithLocalFactors(combined, country);
  adjusted = applyTrullemansAdjustments(adjusted);

  // Comparaison aux normes saisonnières
  const month = new Date().getMonth();
  const season =
    month <= 1 || month === 11 ? "winter" :
    month >= 2 && month <= 4 ? "spring" :
    month >= 5 && month <= 7 ? "summer" : "autumn";
  const norm = getNorm(season);

  let anomaly = null;
  if (adjusted.temperature_max > norm.temp_max + 5) {
    anomaly = { type: "chaud", message: "Anomalie : températures très élevées" };
  } else if (adjusted.temperature_min < norm.temp_min - 5) {
    anomaly = { type: "froid", message: "Anomalie : froid inhabituel" };
  }

  // Calcul de fiabilité
  const reliability = analyseFiabilite(results, errors);

  return {
    combined: { ...adjusted, reliability, anomaly },
    errors,
    successCount: results.length,
  };
}
