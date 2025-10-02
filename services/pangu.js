// services/pangu.js
// 🐉 CMA Pangu-Weather (HuggingFace / CMA API)

import fetch from "node-fetch";

export default async function pangu({ lat, lon, country }) {
  try {
    const url = `${process.env.PANGU_API}/forecast?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Pangu API error: ${res.statusText}`);
    const data = await res.json();

    return {
      temperature: data?.temperature ?? null,
      precipitation: data?.precipitation ?? null,
      wind: data?.wind ?? null,
      reliability: 75,
      source: "Pangu"
    };
  } catch (err) {
    console.error("❌ Pangu fetch error:", err.message);
    return { error: err.message, reliability: 0, source: "Pangu" };
  }
}
