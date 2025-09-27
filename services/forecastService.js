// services/forecastService.js
import runSuperForecast from "./superForecast.js";
import applyClimateFactors from "./climateFactors.js";
import adjustWithLocalFactors from "./localFactors.js";
import openweather from "./openweather.js";
import { REGIONS_COORDS } from "./regionsCoords.js";

/** Bulletin national (zones couvertes) — conserve forecast + sources numériques */
async function getNationalForecast(country) {
  try {
    const regions = REGIONS_COORDS[country] || {};
    const forecasts = {};

    for (const [region, coords] of Object.entries(regions)) {
      let sf = await runSuperForecast({ lat: coords.lat, lon: coords.lon, country });
      sf = applyClimateFactors(sf, coords.lat, coords.lon);
      sf = adjustWithLocalFactors(sf, country);

      forecasts[region] = {
        lat: coords.lat, lon: coords.lon, country,
        forecast: sf.forecast || "⚠️ Pas de données",
        sources: sf.sources || null
      };
    }

    return { country, forecasts, source: "Centrale Nucléaire Météo" };
  } catch (err) {
    console.error("❌ getNationalForecast error:", err.message);
    return { country, error: err.message, forecasts: {} };
  }
}

/** Prévision locale — moteur pour zones couvertes, OpenWeather sinon */
async function getLocalForecast(lat, lon, country) {
  try {
    if (REGIONS_COORDS[country]) {
      let sf = await runSuperForecast({ lat, lon, country });
      sf = applyClimateFactors(sf, lat, lon);
      sf = adjustWithLocalFactors(sf, country);
      return sf; // {forecast, sources}
    }
    const ow = await openweather(lat, lon);
    return { lat, lon, country, forecast: ow, source: "OpenWeather (fallback)" };
  } catch (err) {
    console.error("❌ getLocalForecast error:", err.message);
    return { lat, lon, country, error: err.message };
  }
}

export default { getNationalForecast, getLocalForecast };
