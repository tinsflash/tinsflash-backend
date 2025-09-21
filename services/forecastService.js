// services/forecastService.js
import meteoManager from "./meteoManager.js";
import openweather from "./openweather.js";
import nasaSat from "./nasaSat.js";
import trullemans from "./trullemans.js";
import wetterzentrale from "./wetterzentrale.js";
import comparator from "./comparator.js";

import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { detectSeasonalAnomaly } from "./forecastVision.js";

import Forecast from "../models/Forecast.js";

/**
 * Récupère la prévision locale
 */
async function getLocalForecast(lat, lon) {
  try {
    // 1. Sources principales via MeteoManager
    const meteomaticsSources = await meteoManager(lat, lon);

    // 2. Autres sources externes
    const [ow, nasa, trul, wett] = await Promise.all([
      openweather.getForecast(lat, lon),
      nasaSat(lat, lon),
      trullemans.getForecast(lat, lon),
      wetterzentrale.getForecast(lat, lon)
    ]);

    const sources = [...meteomaticsSources, ow, nasa, trul, wett].filter(Boolean);

    if (!sources.length) {
      throw new Error("Aucune source disponible pour les prévisions locales");
    }

    // 3. Fusion intelligente des modèles
    let merged = comparator.mergeForecasts(sources);

    // 4. Ajustements
    merged = applyGeoFactors(merged, lat, lon);
    merged = applyLocalFactors(merged, lat, lon);

    // 5. Détection des anomalies saisonnières
    const anomaly = detectSeasonalAnomaly(merged);
    merged.anomaly = anomaly || null;

    // 6. Sauvegarde MongoDB
    const forecastDoc = new Forecast({
      timestamp: new Date(),
      location: { lat, lon },
      data: merged,
      sources: sources.map(s => s.source || "unknown")
    });

    await forecastDoc.save();

    return {
      combined: merged,
      sources: sources.map(s => s.source),
      anomaly
    };
  } catch (err) {
    console.error("❌ Erreur getLocalForecast:", err.message);
    return { error: err.message };
  }
}

/**
 * Prévision nationale (agrégation par pays)
 */
async function getNationalForecast(country) {
  try {
    // TODO : améliorer avec des points de référence nationaux
    const refLatLon = {
      BE: [50.85, 4.35], // Bruxelles
      FR: [48.85, 2.35], // Paris
      US: [38.9, -77.0]  // Washington
    };

    const coords = refLatLon[country] || [50.85, 4.35];
    return await getLocalForecast(coords[0], coords[1]);
  } catch (err) {
    console.error("❌ Erreur getNationalForecast:", err.message);
    return { error: err.message };
  }
}

/**
 * Prévisions 7 jours (simplifiées)
 */
async function get7DayForecast(lat, lon) {
  try {
    const forecast = await getLocalForecast(lat, lon);
    const days = [];

    if (forecast?.combined?.temperature) {
      for (let i = 0; i < 7; i++) {
        days.push({
          jour: `Jour ${i + 1}`,
          description: forecast.combined.description || "Prévisions en cours...",
          temperature_min: forecast.combined.temperature_min || null,
          temperature_max: forecast.combined.temperature_max || null,
          vent: forecast.combined.wind || null,
          precipitation: forecast.combined.precipitation || null,
          fiabilité: forecast.combined.reliability || null,
          anomalie: forecast.combined.anomaly?.message || "Conditions normales"
        });
      }
    }

    return { days };
  } catch (err) {
    console.error("❌ Erreur get7DayForecast:", err.message);
    return { error: err.message };
  }
}

export default {
  getLocalForecast,
  getNationalForecast,
  get7DayForecast
};
