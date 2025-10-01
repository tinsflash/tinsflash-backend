// services/meteomatics.js
// 🔗 Accès générique Meteomatics — enrichi (7 jours, variables multiples)

import fetchMeteomaticsDefault, { fetchMeteomatics as fetchMeteomaticsNamed } from "../utils/meteomatics.js";

// On choisit toujours la bonne fonction
const fetchMeteomatics = fetchMeteomaticsNamed || fetchMeteomaticsDefault;

/**
 * Récupère les prévisions enrichies depuis Meteomatics
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @param {string} model - modèle Meteomatics ("gfs", "ecmwf-ifs", "icon-eu", etc.)
 */
export default async function meteomatics(lat, lon, model = "gfs") {
  const data = await fetchMeteomatics([], lat, lon, model);

  if (!data) return { source: `Meteomatics (${model})`, error: "Pas de données" };

  return {
    source: `Meteomatics (${model})`,
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
