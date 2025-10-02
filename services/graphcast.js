// services/graphcast.js
// 🤖 Google DeepMind GraphCast (via microservice Python REST)

import fetch from "node-fetch";

export default async function graphcast({ lat, lon, country }) {
  try {
    const url = `${process.env.GRAPHCAST_API}/forecast?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`GraphCast API error: ${res.statusText}`);
    const data = await res.json();

    return {
      temperature: data?.temperature ?? null,
      precipitation: data?.precipitation ?? null,
      wind: data?.wind ?? null,
      reliability: 80,
      source: "GraphCast"
    };
  } catch (err) {
    console.error("❌ GraphCast fetch error:", err.message);
    return { error: err.message, reliability: 0, source: "GraphCast" };
  }
}
