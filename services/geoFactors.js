// PATH: services/geoFactors.js
// 🌍 Ajustements géographiques – altitude, relief, océans, microclimats

import axios from "axios";

export async function applyGeoFactors(forecast, lat, lon) {
  if (!forecast) return forecast;

  try {
    const res = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    const elevation = res.data.results[0].elevation;

    // Ajustement altitude
    if (elevation > 500) {
      forecast.temperature_min = (forecast.temperature_min || 0) - 2;
      forecast.temperature_max = (forecast.temperature_max || 0) - 2;
    }

    // Ajustement proximité Atlantique (simplifié)
    if (lon > -5 && lon < 10) {
      forecast.reliability = (forecast.reliability || 0) + 3;
    }
  } catch (err) {
    console.warn("⚠️ GeoFactors API error:", err.message);
  }

  return forecast;
}

// ✅ Export nommé unique
export default { applyGeoFactors };
