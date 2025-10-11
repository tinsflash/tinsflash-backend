// services/ecmwf.js
// ✅ ECMWF via Open-Meteo (IFS global) – fallback Meteomatics si dispo

import fetch from "node-fetch";

export default async function ecmwf(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,windspeed_10m,relative_humidity_2m,pressure_msl&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur ECMWF: ${res.status}`);
    const data = await res.json();

    return {
      source: "ECMWF (Open-Meteo IFS)",
      temperature: data?.hourly?.temperature_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      windspeed: data?.hourly?.windspeed_10m || [],
      humidity: data?.hourly?.relative_humidity_2m || [],
      pressure: data?.hourly?.pressure_msl || [],
      reliability: 93,
    };
  } catch (err) {
    console.error("❌ ECMWF error:", err.message);
    return { source: "ECMWF", error: err.message, reliability: 0 };
  }
}
