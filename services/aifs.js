// services/aifs.js
// 🌍 ECMWF AIFS (AI Forecasting System)
// Source officielle ECMWF (Copernicus/MARS API)

import fetch from "node-fetch";

export default async function aifs({ lat, lon, country }) {
  try {
    const url = `https://api.ecmwf.int/v1/aifs?lat=${lat}&lon=${lon}&format=json`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.ECMWF_KEY}` }
    });

    if (!res.ok) throw new Error(`ECMWF AIFS API error: ${res.statusText}`);
    const data = await res.json();

    return {
      temperature: data?.temperature_2m ?? null,
      precipitation: data?.total_precipitation ?? null,
      wind: data?.wind_10m ?? null,
      reliability: 85,
      source: "AIFS"
    };
  } catch (err) {
    console.error("❌ AIFS fetch error:", err.message);
    return { error: err.message, reliability: 0, source: "AIFS" };
  }
}
