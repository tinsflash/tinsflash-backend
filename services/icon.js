// services/icon.js
// 🇩🇪 ICON (DWD) via Open-Meteo – Modèle européen 7 jours

import fetch from "node-fetch";

export default async function icon(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,windspeed_10m,pressure_msl,relative_humidity_2m&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur ICON: ${res.status}`);
    const data = await res.json();

    return {
      source: "ICON (DWD)",
      temperature: data?.hourly?.temperature_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      windspeed: data?.hourly?.windspeed_10m || [],
      humidity: data?.hourly?.relative_humidity_2m || [],
      pressure: data?.hourly?.pressure_msl || [],
      reliability: 91,
    };
  } catch (err) {
    console.error("❌ ICON error:", err.message);
    return { source: "ICON (DWD)", error: err.message, reliability: 0 };
  }
}
