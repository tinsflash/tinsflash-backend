// services/climateFactors.js
import axios from "axios";

/**
 * Applique des correctifs climat / relief / facteurs externes
 * sur une prévision brute.
 *
 * - Altitude : baisse de température au-dessus de 500 m
 * - Proximité océan/mer : humidité accrue, fiabilité renforcée
 * - Facteur urbain : îlot de chaleur (température +1°C)
 * - Indices climatiques globaux (placeholder → ENSO, NAO, etc.)
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

    // 2. Proximité océan (simplifié : Atlantique/Manche)
    if (lon > -10 && lon < 15 && lat > 35 && lat < 60) {
      adjusted.humidity = (adjusted.humidity ?? 50) + 5;
      adjusted.reliability = (adjusted.reliability ?? 50) + 3;
    }

    // 3. Facteur urbain (îlot de chaleur)
    if (options.zoneType === "urban") {
      adjusted.temperature_min = (adjusted.temperature_min ?? 0) + 1;
      adjusted.temperature_max = (adjusted.temperature_max ?? 0) + 1;
    }

    // 4. Facteur hydrologique (si proche de fleuve/mer → humidité renforcée)
    if (options.nearWater === true) {
      adjusted.humidity = (adjusted.humidity ?? 50) + 10;
    }

    // 5. Indices climatiques globaux (placeholder → NOAA/Copernicus)
    adjusted.globalClimateIndex = "neutral"; 
    // ex: "El Niño", "La Niña", "NAO+", "NAO-"

  } catch (err) {
    console.error("⚠️ ClimateFactors error:", err.message);
  }

  return adjusted;
}

export default { applyClimateFactors };
