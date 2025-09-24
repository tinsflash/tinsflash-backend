// services/climateFactors.js
import axios from "axios";

/**
 * Applique des correctifs climat / relief / facteurs externes
 * sur une prévision brute.
 */
async function applyClimateFactors(forecast, lat, lon, options = {}) {
  let adjusted = { ...forecast };

  try {
    // 1. Altitude
    const elevationRes = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    const elevation = elevationRes.data.results[0].elevation;

    if (elevation > 500) {
      adjusted.temperature_min = (adjusted.temperature_min ?? 0) - 2;
      adjusted.temperature_max = (adjusted.temperature_max ?? 0) - 2;
    }

    // 2. Proximité océan (simplifié Atlantique)
    if (lon > -5 && lon < 10) {
      adjusted.humidity = (adjusted.humidity ?? 50) + 5;
      adjusted.reliability = (adjusted.reliability ?? 50) + 3;
    }

    // 3. Facteur urbain (îlot de chaleur)
    if (options.zoneType === "urban") {
      adjusted.temperature_min = (adjusted.temperature_min ?? 0) + 1;
      adjusted.temperature_max = (adjusted.temperature_max ?? 0) + 1;
    }

    // 4. Indices climatiques globaux (placeholder → NOAA/Copernicus)
    adjusted.globalClimateIndex = "neutral"; // ex: "El Niño", "La Niña", "NAO+"

  } catch (err) {
    console.error("⚠️ ClimateFactors error:", err.message);
  }

  return adjusted;
}

export default { applyClimateFactors };
