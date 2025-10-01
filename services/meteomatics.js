// utils/meteomatics.js
// 🌍 Connexion Meteomatics enrichie — 7 jours, paramètres élargis

import axios from "axios";

const METEO_BASE_URL = "https://api.meteomatics.com";
const USER = process.env.METEOMATICS_USER;
const PASS = process.env.METEOMATICS_PASS;

/**
 * Appel générique Meteomatics
 * @param {Array} parameters - ex: ["t_2m:C","precip_1h:mm","wind_speed_10m:ms"]
 * @param {number} lat
 * @param {number} lon
 * @param {string} model - "ecmwf", "gfs", "icon-eu"...
 * @param {number} days - horizon en jours (default = 7)
 */
export async function fetchMeteomatics(
  parameters,
  lat,
  lon,
  model = "gfs",
  days = 7
) {
  try {
    const now = new Date();
    const start = now.toISOString().split(".")[0] + "Z";
    const end = new Date(now.getTime() + days * 24 * 3600 * 1000)
      .toISOString()
      .split(".")[0] + "Z";

    // === Paramètres enrichis par défaut ===
    const defaultParams = [
      "t_2m:C",                   // Température 2m
      "t_max_2m_24h:C",           // Max quotidien
      "t_min_2m_24h:C",           // Min quotidien
      "precip_1h:mm",             // Précipitations horaires
      "relative_humidity_2m:p",   // Humidité relative
      "msl_pressure:hPa",         // Pression niveau mer
      "wind_speed_10m:ms",        // Vent moyen 10m
      "wind_dir_10m:d",           // Direction du vent
      "wind_gusts_10m_1h:ms",     // Rafales
      "snow_depth:cm"             // Neige
    ];

    const paramStr = (parameters.length ? parameters : defaultParams).join(",");
    const url = `${METEO_BASE_URL}/${start}--${end}:PT1H/${paramStr}/${lat},${lon}/json?model=${model}`;

    const res = await axios.get(url, {
      auth: { username: USER, password: PASS },
    });

    return res.data.data.reduce((acc, cur) => {
      acc[cur.parameter] = cur.coordinates[0].dates.map((d) => ({
        date: d.date,
        value: d.value,
      }));
      return acc;
    }, {});
  } catch (err) {
    console.error(`❌ Meteomatics ${model} error:`, err.message);
    return null;
  }
}

export default fetchMeteomatics;
