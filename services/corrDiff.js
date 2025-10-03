// services/corrDiff.js
// 🌍 NVIDIA CorrDiff via HuggingFace (Earth2Studio microservice)

import fetch from "node-fetch";

export default async function corrDiff({ lat, lon }) {
  try {
    const url = `${process.env.CORRDIFF_API}/forecast`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon })
    });

    if (!res.ok) throw new Error(`CorrDiff API error: ${res.statusText}`);
    const data = await res.json();

    return {
      temperature: data?.temperature ?? null,
      precipitation: data?.precipitation ?? null,
      wind: data?.wind ?? null,
      reliability: 95, // très fort
      source: "CorrDiff"
    };
  } catch (err) {
    console.error("❌ CorrDiff fetch error:", err.message);
    return { error: err.message, reliability: 0, source: "CorrDiff" };
  }
}
