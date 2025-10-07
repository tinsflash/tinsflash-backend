// PATH: services/geoFactors.js
// 🌍 Ajustements géographiques – altitude, relief, océans, microclimats réels

import axios from "axios";

const cache = new Map();
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function applyGeoFactors(forecast, lat, lon) {
  if (!forecast) return forecast;
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // ⚡ Cache anti-rate-limit
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`,
      { timeout: 5000 }
    );
    const elevation = res.data.results?.[0]?.elevation || 0;

    // 🏔️ Altitude
    if (elevation > 500) {
      forecast.temperature_min = (forecast.temperature_min || 0) - 2;
      forecast.temperature_max = (forecast.temperature_max || 0) - 2;
    }

    // 🌊 Influence atlantique
    if (lon > -5 && lon < 10) {
      forecast.reliability = (forecast.reliability || 0) + 3;
    }

    cache.set(key, forecast);
    await delay(300); // anti-429
  } catch (err) {
    console.warn("⚠️ GeoFactors API error:", err.message);
  }

  return forecast;
}

export default { applyGeoFactors };
