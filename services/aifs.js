// services/aifs.js
// 🌐 AIFS (AI Forecasting System – ECMWF) – Données 0.25° – 10 jours

import fetch from "node-fetch";

export default async function aifs(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,windspeed_10m,winddirection_10m&forecast_days=10&models=ecmwf_aifs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur AIFS: ${res.status}`);
    const data = await res.json();

    return {
      source: "AIFS (ECMWF)",
      temperature: data?.hourly?.temperature_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      windspeed: data?.hourly?.windspeed_10m || [],
      winddirection: data?.hourly?.winddirection_10m || [],
      reliability: 92,
    };
  } catch (err) {
    console.error("❌ AIFS error:", err.message);
    return { source: "AIFS (ECMWF)", error: err.message, reliability: 0 };
  }
}
