// services/forecastService.js
// ⚡ Centrale nucléaire météo – Service de prévisions

import runSuperForecast from "./superForecast.js";
import applyClimateFactors from "./climateFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import openweather from "./openweather.js";
import { REGIONS_COORDS } from "./regionsCoords.js";

/**
 * Bulletin national (zones couvertes par la centrale nucléaire météo)
 */
async function getNationalForecast(country) {
  try {
    const regions = REGIONS_COORDS[country] || {};
    const forecasts = {};

    for (const [region, coords] of Object.entries(regions)) {
      let sf = await runSuperForecast({ lat: coords.lat, lon: coords.lon, country });
      sf = applyClimateFactors(sf, coords.lat, coords.lon);
      sf = adjustWithLocalFactors(sf, country);

      forecasts[region] = sf.forecast || sf.error || "⚠️ Pas de données";
    }

    return { country, forecasts, source: "Centrale Nucléaire Météo" };
  } catch (err) {
    console.error(`❌ getNationalForecast error (${country}):`, err.message);
    return { country, error: err.message };
  }
}

/**
 * Prévision locale
 * - Zones couvertes → moteur atomique
 * - Zones non couvertes → OpenWeather fallback
 */
async function getLocalForecast(lat, lon, country) {
  try {
    if (REGIONS_COORDS[country]) {
      let sf = await runSuperForecast({ lat, lon, country });
      sf = applyClimateFactors(sf, lat, lon);
      sf = adjustWithLocalFactors(sf, country);
      return sf;
    }

    // fallback OpenWeather pour zones non couvertes
    const ow = await openweather(lat, lon);
    return { lat, lon, country, forecast: ow, source: "OpenWeather (fallback)" };
  } catch (err) {
    console.error(`❌ getLocalForecast error (${country}):`, err.message);
    return { lat, lon, country, error: err.message };
  }
}

/**
 * Alias pour compatibilité avec runGlobal.js
 * → Utilise la prévision nationale
 */
async function getForecast(country) {
  if (!country) {
    return { error: "❌ Aucun pays spécifié pour getForecast()" };
  }
  return await getNationalForecast(country);
}

export default { getNationalForecast, getLocalForecast, getForecast };
