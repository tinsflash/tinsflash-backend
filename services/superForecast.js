// services/superForecast.js
import { getMeteomatics } from "../hiddensources/meteomatics.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { compareSources } from "../hiddensources/comparator.js";
import { parseWetterzentraleData } from "./wetterzentrale.js";
import { adjustWithLocalFactors } from "./localFactors.js";
import { applyTrullemansAdjustments } from "./trullemans.js";
import { applyGeoFactors } from "./geoFactors.js";
import { getNorm } from "../utils/seasonalNorms.js";
import { askOpenAI } from "../utils/openai.js";

/**
 * 🌍 Super moteur météo TINSFLASH
 * - croise plusieurs modèles
 * - applique IA pour corriger incohérences
 * - ajoute ajustements locaux + géographiques
 * - détecte anomalies climatiques
 */
export async function runSuperForecast(lat, lon, country = "BE") {
  const sources = [];
  const errors = [];

  // 1️⃣ Charger les différentes sources
  try {
    const meteomatics = await getMeteomatics(lat, lon);
    meteomatics.error ? errors.push(meteomatics.error) : sources.push(meteomatics);
  } catch (e) {
    errors.push("Meteomatics: " + e.message);
  }

  try {
    const openweather = await getOpenWeather(lat, lon);
    openweather.error ? errors.push(openweather.error) : sources.push(openweather);
  } catch (e) {
    errors.push("OpenWeather: " + e.message);
  }

  try {
    const comparator = await compareSources(lat, lon);
    sources.push(...comparator);
  } catch (e) {
    errors.push("Comparator: " + e.message);
  }

  try {
    const wetter = await parseWetterzentraleData(lat, lon);
    wetter.error ? errors.push(wetter.error) : sources.push(wetter);
  } catch (e) {
    errors.push("Wetterzentrale: " + e.message);
  }

  // 2️⃣ IA : croiser et analyser les résultats
  let aiSummary = null;
  try {
    const prompt = `
      Voici des prévisions météo de plusieurs modèles pour lat=${lat}, lon=${lon}.
      Sources :
      ${JSON.stringify(sources, null, 2)}

      Ta mission :
      - détecter et corriger les incohérences
      - produire une prévision finale réaliste (T° min/max, vent, précipitations, description)
      - donner un indice de fiabilité (0–100) basé sur la cohérence entre modèles
      Réponds uniquement en JSON.
    `;
    const aiResponse = await askOpenAI(prompt);

    // ✅ Sécurité : vérifier si la réponse est bien du JSON
    if (aiResponse && aiResponse.trim().startsWith("{")) {
      aiSummary = JSON.parse(aiResponse);
    } else {
      errors.push("Réponse IA invalide: " + aiResponse?.substring(0, 120));
    }
  } catch (err) {
    errors.push("Erreur IA: " + err.message);
  }

  // 3️⃣ Corrections locales et géographiques
  let forecast = aiSummary || sources[0] || {};
  forecast = adjustWithLocalFactors(forecast, country);
  forecast = applyTrullemansAdjustments(forecast);
  forecast = await applyGeoFactors(forecast, lat, lon);

  // 4️⃣ Vérifier normes saisonnières
  const season = getSeason(new Date());
  const norm = getNorm(season);
  if (forecast.temperature_max > norm.temp_max + 10) {
    forecast.anomaly = "🌡️ Chaleur anormale";
  } else if (forecast.temperature_min < norm.temp_min - 10) {
    forecast.anomaly = "🥶 Froid anormal";
  }

  return {
    lat,
    lon,
    country,
    forecast,
    errors,
    sources: sources.map((s) => s.source || "unknown"),
  };
}

function getSeason(date) {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}
