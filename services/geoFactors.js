// services/geoFactors.js
import axios from "axios";

async function applyGeoFactors(forecast, lat, lon) {
  if (!forecast) return forecast;

  try {
    const res = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    const elevation = res.data.results[0].elevation;

    // Ajustement altitude
    if (elevation > 500) {
      forecast.temperature_min -= 2;
      forecast.temperature_max -= 2;
    }

    // Ajustement proximité Atlantique (simplifié)
    if (lon > -5 && lon < 10) {
      forecast.reliability += 3;
    }
  } catch (err) {
    console.warn("⚠️ GeoFactors API error:", err.message);
  }

  return forecast;
}

export default { applyGeoFactors };
