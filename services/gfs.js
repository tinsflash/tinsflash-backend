// services/gfs.js
// 🔗 GFS via Meteomatics — enrichi (7 jours, variables multiples)

import { fetchMeteomatics } from "../services/meteomatics.js";

export default async function gfs(lat, lon) {
  const data = await fetchMeteomatics([], lat, lon, "gfs");

  if (!data) return { source: "GFS (Meteomatics)", error: "Pas de données" };

  return {
    source: "GFS (Meteomatics)",
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
}
