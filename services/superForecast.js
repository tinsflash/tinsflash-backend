// -------------------------
// 🌍 services/superForecast.js
// Super moteur météo TINSFLASH
// Multi-modèles + IA + pondérations dynamiques
// -------------------------

import { getMeteomatics } from "../hiddensources/meteomatics.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { compareSources } from "../hiddensources/comparator.js";
import { parseWetterzentraleData } from "./wetterzentrale.js";
import { adjustWithLocalFactors } from "./localFactors.js";
import { applyTrullemansAdjustments } from "./trullemans.js";
import { applyGeoFactors } from "./geoFactors.js";
import { getNorm } from "../utils/seasonalNorms.js";
import { askOpenAI } from "../utils/openai.js";

// -------------------------
// Pondérations par modèle
// -------------------------
const MODEL_WEIGHTS = {
  GFS: 40,
  ECMWF: 25,
  ICON: 20,
  ARPEGE: 10,
  LOCAL: 5,
};

// -------------------------
// Super moteur météo
// -------------------------
export async function runSuperForecast(lat, lon, country = "BE") {
  const sources = [];
  const errors = [];

  // 1️⃣ Charger différentes sources
  const meteomatics = await getMeteomatics(lat, lon);
  meteomatics.error ? errors.push(meteomatics.error) : sources.push(meteomatics);

  const openweather = await getOpenWeather(lat, lon);
  openweather.error ? errors.push(openweather.error) : sources.push(openweather);

  const comparator = await compareSources(lat, lon);
  sources.push(...comparator);

  // Wetterzentrale (si disponible)
  try {
    const wz = parseWetterzentraleData({
      temp: 14, // ⚠️ à remplacer par fetch réel
      wind: 20,
      desc: "Nuageux avec éclaircies",
    });
    if (!wz.error) sources.push({ ...wz, source: "Wetterzentrale" });
  } catch (err) {
    errors.push("Wetterzentrale: " + err.message);
  }

  // 2️⃣ Fusion pondérée (IA + pondérations fixes)
  let aiSummary = null;
  try {
    const prompt = `
      Voici des prévisions météo de plusieurs modèles pour lat=${lat}, lon=${lon}.
      Sources :
      ${JSON.stringify(sources, null, 2)}

      Pondérations (influence dans le calcul final) :
      - GFS: ${MODEL_WEIGHTS.GFS}%
      - ECMWF: ${MODEL_WEIGHTS.ECMWF}%
      - ICON: ${MODEL_WEIGHTS.ICON}%
      - ARPEGE: ${MODEL_WEIGHTS.ARPEGE}%
      - Local/Wetterzentrale: ${MODEL_WEIGHTS.LOCAL}%

      Ta mission :
      - Applique les pondérations pour fusionner les données
      - Détecte et corrige les incohérences
      - Sors une prévision finale réaliste en JSON avec :
        { temperature_min, temperature_max, wind, precipitation, description, reliability, code }
    `;
    const aiResponse = await askOpenAI(prompt);
    aiSummary = JSON.parse(aiResponse);
  } catch (err) {
    errors.push("Erreur IA: " + err.message);
  }

  // 3️⃣ Corrections locales & géographiques
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
    weights: MODEL_WEIGHTS,
  };
}

// -------------------------
// Helpers
// -------------------------
function getSeason(date) {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}
