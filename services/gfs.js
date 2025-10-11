// services/gfs.js
// 🌐 GFS (Global Forecast System, NOAA) – Données 0.25° jusqu’à 16 jours

import fetch from "node-fetch";

export default async function gfs(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,windspeed_10m,winddirection_10m,pressure_msl&forecast_days=16`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur GFS: ${res.status}`);
    const data = await res.json();

    return {
      source: "GFS (NOAA)",
      temperature: data?.hourly?.temperature_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      windspeed: data?.hourly?.windspeed_10m || [],
      winddirection: data?.hourly?.winddirection_10m || [],
      pressure: data?.hourly?.pressure_msl || [],
      reliability: 89,
    };
  } catch (err) {
    console.error("❌ GFS error:", err.message);
    return { source: "GFS (NOAA)", error: err.message, reliability: 0 };
  }
}
