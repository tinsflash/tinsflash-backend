// services/icon.js
// ✅ ICON via Meteomatics (7 jours, données enrichies)

import meteomatics from "./meteomatics.js";

export default async function icon(lat, lon) {
  try {
    const data = await meteomatics(lat, lon, "icon-eu");

    if (!data) return { source: "ICON (Meteomatics)", error: "Pas de données" };

    return {
      source: "ICON (Meteomatics)",
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
    return { source: "ICON (Meteomatics)", error: err.message };
  }
}
