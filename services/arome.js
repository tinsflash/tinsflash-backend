// services/arome.js
// 🇫🇷 AROME (Météo-France, via Meteomatics)
// Haute résolution (~1.3 km) — France, Belgique

import { fetchMeteomatics } from "../utils/meteomatics.js";

export default async function arome(lat, lon) {
  try {
    const params = [
      "t_2m:C",
      "t_max_2m_24h:C",
      "t_min_2m_24h:C",
      "precip_1h:mm",
      "relative_humidity_2m:p",
      "msl_pressure:hPa",
      "wind_speed_10m:ms",
      "wind_dir_10m:d",
      "wind_gusts_10m_1h:ms",
      "snow_depth:cm"
    ];

    const data = await fetchMeteomatics(params, lat, lon, "arome");

    if (!data) return { source: "AROME (Meteomatics)", error: "Pas de données" };

    return {
      source: "AROME (Meteomatics)",
      temperature: data["t_2m:C"] || [],
      temperature_max: data["t_max_2m_24h:C"] || [],
      temperature_min: data["t_min_2m_24h:C"] || [],
      precipitation: data["precip_1h:mm"] || [],
      humidity: data["relative_humidity_2m:p"] || [],
      pressure: data["msl_pressure:hPa"] || [],
      wind: data["wind_speed_10m:ms"] || [],
      wind_dir: data["wind_dir_10m:d"] || [],
      wind_gusts: data["wind_gusts_10m_1h:ms"] || [],
      snow_depth: data["snow_depth:cm"] || []
    };
  } catch (err) {
    console.error("❌ AROME fetch error:", err.message);
    return { source: "AROME (Meteomatics)", error: err.message };
  }
}
