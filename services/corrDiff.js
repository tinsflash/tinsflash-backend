// services/corrDiff.js
// ⚡ NVIDIA CorrDiff (Earth-2, downscaling haute résolution)

import fetch from "node-fetch";

export default async function corrDiff({ lat, lon, country }) {
  try {
    const url = `https://api.earth2.nvidia.com/corrdiff?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.NVIDIA_KEY}` }
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
