// services/nowcastnet.js
// ⏱️ Microsoft NowcastNet (short range radar AI)

import fetch from "node-fetch";

export default async function nowcastnet({ lat, lon, country }) {
  try {
    const url = `${process.env.NOWCASTNET_API}/nowcast?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`NowcastNet API error: ${res.statusText}`);
    const data = await res.json();

    return {
      temperature: data?.temperature ?? null,
      precipitation: data?.precipitation ?? null,
      wind: data?.wind ?? null,
      reliability: 90, // fort pour 0-6h
      source: "NowcastNet"
    };
  } catch (err) {
    console.error("❌ NowcastNet fetch error:", err.message);
    return { error: err.message, reliability: 0, source: "NowcastNet" };
  }
}
