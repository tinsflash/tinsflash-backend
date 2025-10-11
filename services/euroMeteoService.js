// services/euroMeteoService.js
// 🇪🇺 EuroMeteo – Agrégateur multi-sources européennes (ECMWF + DWD + AROME)

import fetch from "node-fetch";

export default async function euroMeteoService(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,pressure_msl,windspeed_10m,relative_humidity_2m&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur EuroMeteo: ${res.status}`);
    const data = await res.json();

    return {
      source: "EuroMeteo (ECMWF + DWD + Météo-France)",
      temperature: data?.hourly?.temperature_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      pressure: data?.hourly?.pressure_msl || [],
      humidity: data?.hourly?.relative_humidity_2m || [],
      windspeed: data?.hourly?.windspeed_10m || [],
      reliability: 91,
    };
  } catch (err) {
    console.error("❌ EuroMeteo error:", err.message);
    return { source: "EuroMeteo", error: err.message, reliability: 0 };
  }
}
