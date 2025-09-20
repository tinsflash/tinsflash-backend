// -------------------------
// 🌍 hiddensources/iconDwd.js
// Modèle ICON (DWD, Allemagne) - open data
// -------------------------

import fetch from "node-fetch";

export async function getIconDwd(lat, lon) {
  try {
    // Open-Meteo proxy vers DWD ICON
    const url = `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.hourly) {
      return { source: "ICON-DWD", error: "Pas de données disponibles" };
    }

    // Moyenne sur 24h glissante
    const temps = data.hourly.temperature_2m || [];
    const precs = data.hourly.precipitation || [];
    const winds = data.hourly.wind_speed_10m || [];

    const avgTemp = temps.reduce((a, b) => a + b, 0) / (temps.length || 1);
    const avgWind = winds.reduce((a, b) => a + b, 0) / (winds.length || 1);
    const totalPrec = precs.reduce((a, b) => a + b, 0);

    return {
      source: "ICON-DWD",
      temperature: Math.round(avgTemp),
      wind: Math.round(avgWind),
      precipitation: Math.round(totalPrec),
      description: "Prévisions ICON-DWD",
    };
  } catch (err) {
    return { source: "ICON-DWD", error: err.message };
  }
}
