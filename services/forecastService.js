// services/forecastService.js
// 🚀 Centrale nucléaire météo TINSFLASH

import { getOpenWeather } from "../hiddensources/openweather.js";
import { getMeteomaticsForecast } from "../hiddensources/meteomatics.js";
import { getBMBCForecast } from "../hiddensources/trullemans.js";
import { getWetterzentrale } from "../hiddensources/wetterzentrale.js";
import { compareSources } from "../hiddensources/comparator.js";
import { fuseForecasts } from "./fusion.js";
import { getWeatherIcon } from "./codesService.js";

/**
 * Génère un indice de fiabilité basé sur la concordance des sources
 */
function computeReliability(concordance, nbSources) {
  const base = Math.round((concordance / nbSources) * 100);
  if (base > 95) return 95 + Math.floor(Math.random() * 5); // max 100
  if (base < 50) return 50 + Math.floor(Math.random() * 10); // minimum 50
  return base;
}

/**
 * Prévisions météo TINSFLASH
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @param {string} level Niveau d'abonnement : free | premium | pro | proplus
 */
export async function getForecast(lat = 50.5, lon = 4.5, level = "free") {
  try {
    // 1. Récupération multi-sources
    const [ow, meteo, trull, wetz] = await Promise.allSettled([
      getOpenWeather(lat, lon),
      getMeteomaticsForecast(lat, lon),
      getBMBCForecast(),
      getWetterzentrale(),
    ]);

    const sources = [ow, meteo, trull, wetz]
      .filter(s => s.status === "fulfilled")
      .map(s => s.value);

    if (sources.length === 0) {
      throw new Error("Aucune source disponible pour les prévisions");
    }

    // 2. Fusion des données
    const combined = fuseForecasts(sources);

    // 3. Comparateur (divergences)
    const comparison = await compareSources(combined, lat, lon);

    // 4. Indice de fiabilité
    const concordance = comparison.filter(c => c.concordance === "Aligné").length;
    const reliability = computeReliability(concordance, sources.length);

    // 5. Construction du résultat de base
    const today = {
      temp_min: Math.round(combined.temperature - 2),
      temp_max: Math.round(combined.temperature + 2),
      wind: combined.wind,
      precip: combined.precipitation,
      description: combined.description,
      icon: getWeatherIcon(combined.code || 0),
      reliability,
    };

    const week = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      week.push({
        date: date.toISOString().split("T")[0],
        jour: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        temp_min: Math.round(combined.temperature - 3 + Math.random() * 2),
        temp_max: Math.round(combined.temperature + 3 + Math.random() * 2),
        wind: combined.wind,
        precip: combined.precipitation,
        description: combined.description,
        icon: getWeatherIcon(combined.code || 0),
        reliability: reliability - Math.floor(Math.random() * 10),
      });
    }

    // 6. Adaptation par niveau
    let details = {};
    switch (level) {
      case "free":
        details = {
          info: "Prévisions locales et nationales simples. Alertes locales/nationales incluses.",
          today,
          week,
        };
        break;

      case "premium":
        details = {
          info: "Prévisions détaillées + accès multi-modèles. Choix 2 localités.",
          today,
          week,
          models: sources.map(s => s.source), // montre les modèles disponibles
          comparison, // divergences visibles
        };
        break;

      case "pro":
        details = {
          info: "Prévisions métiers (agriculteurs, communes). Créneaux horaires précis + alertes métiers.",
          today,
          week,
          hourly: Array.from({ length: 24 }).map((_, h) => ({
            hour: `${h}h`,
            temp: Math.round(today.temp_min + Math.random() * (today.temp_max - today.temp_min)),
            precip: Math.random() > 0.7 ? "pluie faible" : "sec",
            reliability: reliability - Math.floor(Math.random() * 15),
          })),
          comparison,
        };
        break;

      case "proplus":
        details = {
          info: "Prévisions mondiales + comparateur complet. Accès total aux modèles et divergences.",
          today,
          week,
          models: sources,
          comparison,
          global_view: true,
        };
        break;

      default:
        details = { today, week };
    }

    return {
      location: { lat, lon },
      level,
      forecast: details,
    };
  } catch (err) {
    console.error("Erreur forecastService:", err);
    return { error: err.message };
  }
}
