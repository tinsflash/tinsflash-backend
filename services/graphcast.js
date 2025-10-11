// services/graphcast.js
// 🧠 Google DeepMind GraphCast – IA globale open-source

import fetch from "node-fetch";

export default async function graphcast(lat, lon) {
  try {
    const url = `https://graphcast-api.openclimatefix.org/forecast?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur GraphCast: ${res.status}`);
    const data = await res.json();

    return {
      source: "GraphCast (DeepMind / OpenClimateFix)",
      temperature: data?.temperature_2m ?? null,
      precipitation: data?.precipitation ?? null,
      windspeed: data?.windspeed_10m ?? null,
      humidity: data?.humidity ?? null,
      reliability: 94,
    };
  } catch (err) {
    console.error("❌ GraphCast error:", err.message);
    return { source: "GraphCast (DeepMind)", error: err.message, reliability: 0 };
  }
}
