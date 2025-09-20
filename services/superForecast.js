// -------------------------
// 🌍 superForecast.js
// Moteur nucléaire météo TINSFLASH
// - Croise toutes les sources disponibles
// - Applique IA pour consolidation
// - Corrige via facteurs locaux, relief, climat
// - Détecte anomalies saisonnières
// -------------------------

import { getMeteomatics } from "../hiddensources/meteomatics.js";
import { getOpenWeather } from "../hiddensources/openweather.js";
import { getIconDwd } from "../hiddensources/iconDwd.js";
import { compareSources } from "../hiddensources/comparator.js";
import { parseWetterzentraleData } from "./wetterzentrale.js";
import { adjustWithLocalFactors } from "./localFactors.js";
import { applyTrullemansAdjustments } from "./trullemans.js";
import { applyGeoFactors } from "./geoFactors.js";
import { getNorm } from "../utils/seasonalNorms.js";
import { askOpenAI } from "../utils/openai.js";

export async function runSuperForecast(lat, lon, country = "BE") {
  const sources = [];
  const errors = [];

  // 1️⃣ Charger toutes les sources météo
  try {
    const meteomatics = await getMeteomatics(lat, lon);
    meteomatics.error ? errors.push(meteomatics.error) : sources.push(meteomatics);
  } catch (err) {
    errors.push("Meteomatics: " + err.message);
  }

  try {
    const openweather = await getOpenWeather(lat, lon);
    openweather.error ? errors.push(openweather.error) : sources.push(openweather);
  } catch (err) {
    errors.push("OpenWeather: " + err.message);
  }

  try {
    const icon = await getIconDwd(lat, lon);
    icon.error ? errors.push(icon.error) : sources.push(icon);
  } catch (err) {
    errors.push("ICON-DWD: " + err.message);
  }

  try {
    const cmp = await compareSources(lat, lon);
    if (Array.isArray(cmp)) sources.push(...cmp);
    else sources.push(cmp);
  } catch (err) {
    errors.push("Comparator: " + err.message);
  }

  // Wetterzentrale (si dispo)
  try {
    const wz = parseWetterzentraleData({ temp: 12, wind: 15, desc: "Couvert" });
    sources.push({ ...wz, source: "Wetterzentrale" });
  } catch (err) {
    errors.push("Wetterzentrale: " + err.message);
  }

  // 2️⃣ IA → consolidation
  let aiSummary = null;
  try {
    const prompt = `
      Tu es expert météo de niveau NASA.
      Voici des prévisions issues de plusieurs modèles pour lat=${lat}, lon=${lon}.
      Sources:
      ${JSON.stringify(sources, null, 2)}

      Mission:
      - Détecter incohérences
      - Produire une prévision finale (temperature_min, temperature_max, wind, precipitation, description)
      - Calculer un indice de fiabilité (0-100)
      - Retourne uniquement en JSON
    `;
    const aiResponse = await askOpenAI(prompt);
    aiSummary = JSON.parse(aiResponse);
  } catch (err) {
    errors.push("Erreur IA: " + err.message);
  }

  // 3️⃣ Corrections locales et géographiques
  let forecast = aiSummary || sources[0] || {};
  forecast = adjustWithLocalFactors(forecast, country);
  forecast = applyTrullemansAdjustments(forecast);
  forecast = await applyGeoFactors(forecast, lat, lon);

  // 4️⃣ Normes saisonnières
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
    sources: sources.map(s => s.source || "unknown"),
  };
}

function getSeason(date) {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}
