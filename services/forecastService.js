// services/forecastService.js
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
    console.error("❌ getNationalForecast error:", err.message);
    return { country, error: err.message };
  }
}

/**
 * Prévision locale
 * Zones couvertes → moteur atomique ; zones non couvertes → OpenWeather
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
    console.error("❌ getLocalForecast error:", err.message);
    return { lat, lon, country, error: err.message };
  }
}

export default { getNationalForecast, getLocalForecast };
