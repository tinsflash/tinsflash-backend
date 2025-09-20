// services/geoFactors.js
import axios from "axios";

// Ajuste les prévisions selon altitude, relief, mer
export async function applyGeoFactors(forecast, lat, lon) {
  if (!forecast) return forecast;

  try {
    const res = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    const elevation = res.data.results[0].elevation;

    if (elevation > 500) {
      forecast.temperature_min -= 2;
      forecast.temperature_max -= 2;
    }
    if (lon > -5 && lon < 10) {
      forecast.reliability += 3; // proximité Atlantique = plus stable
    }
  } catch (err) {
    console.warn("⚠️ GeoFactors API error:", err.message);
  }

  return forecast;
}
