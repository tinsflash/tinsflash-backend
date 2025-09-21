// services/iconDwd.js
import axios from "axios";

/**
 * Récupère les prévisions ICON-DWD (via Open-Meteo)
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 */
export default async function iconDwd(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`;

    const res = await axios.get(url);

    // Extraire et calculer les valeurs
    const temps = res.data?.hourly?.temperature_2m || [];
    const winds = res.data?.hourly?.wind_speed_10m || [];
    const rains = res.data?.hourly?.precipitation || [];

    return {
      source: "ICON-DWD",
      temperature_min: temps.length ? Math.min(...temps) : null,
      temperature_max: temps.length ? Math.max(...temps) : null,
      wind: winds.length ? Math.max(...winds) : null,
      precipitation: rains.length
        ? rains.reduce((a, b) => a + b, 0)
        : null,
      reliability: 85, // ICON est robuste sur l'Europe
      raw: res.data, // garder les données brutes en backup
    };
  } catch (err) {
    console.error("❌ ICON-DWD error:", err.message);
    return {
      source: "ICON-DWD",
      temperature_min: null,
      temperature_max: null,
      wind: null,
      precipitation: null,
      reliability: 0,
      error: err.message,
    };
  }
}
