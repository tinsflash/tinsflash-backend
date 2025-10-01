// services/ecmwf.js
// ✅ ECMWF via Meteomatics (7 jours, données enrichies)

import meteomatics from "./meteomatics.js";

export default async function ecmwf(lat, lon) {
  try {
    const data = await meteomatics(lat, lon, "ecmwf-ifs");

    if (!data) return { source: "ECMWF (Meteomatics)", error: "Pas de données" };

    return {
      source: "ECMWF (Meteomatics)",
      temperature: data.temperature || [],
      temperature_max: data.temperature_max || [],
      temperature_min: data.temperature_min || [],
      precipitation: data.precipitation || [],
      humidity: data.humidity || [],
      pressure: data.pressure || [],
      wind: data.wind || [],
      wind_dir: data.wind_dir || [],
      wind_gusts: data.wind_gusts || [],
      snow_depth: data.snow_depth || [],
    };
  } catch (err) {
    return { source: "ECMWF (Meteomatics)", error: err.message };
  }
}
