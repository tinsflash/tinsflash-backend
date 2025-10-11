// services/arome.js
// 🇫🇷 AROME – Modèle haute résolution Météo-France via Open-Meteo fallback

import fetch from "node-fetch";

export default async function arome(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,cloudcover,windspeed_10m,winddirection_10m&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur AROME: ${res.status}`);
    const data = await res.json();

    return {
      source: "AROME (Météo-France via Open-Meteo)",
      temperature: data?.hourly?.temperature_2m || [],
      precipitation: data?.hourly?.precipitation || [],
      cloudcover: data?.hourly?.cloudcover || [],
      windspeed: data?.hourly?.windspeed_10m || [],
      winddirection: data?.hourly?.winddirection_10m || [],
      reliability: 90,
    };
  } catch (err) {
    console.error("❌ AROME error:", err.message);
    return { source: "AROME", error: err.message, reliability: 0 };
  }
}
