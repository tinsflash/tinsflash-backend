// ==========================================================
// 🤖 TINSFLASH – aiModelsChecker.js (v1.0 REAL CONNECTED)
// ==========================================================
// ✅ Rôle : interroger les IA météo externes (Hugging Face / APIs internes)
// ✅ Fournit : statut, latence, et données météo estimées (T, P, V)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

// ==========================================================
// 🔗 Points d'accès IA (ajuster si tes API privées changent)
// ==========================================================
const IA_ENDPOINTS = {
  graphcast: process.env.GRAPHCAST_API || "https://api-inference.huggingface.co/models/deepmind/graphcast",
  pangu: process.env.PANGU_API || "https://api-inference.huggingface.co/models/huawei-noah/pangu-weather",
  corrdiff: process.env.CORRDIFF_API || "https://api-inference.huggingface.co/models/nvidia/corrdiff",
  nowcastnet: process.env.NOWCASTNET_API || "https://api-inference.huggingface.co/models/microsoft/NowcastNet"
};

// ==========================================================
// 🚀 Fonction principale – Ping + Extraction IA
// ==========================================================
export async function checkAIModels(lat, lon) {
  const results = {};
  for (const [name, url] of Object.entries(IA_ENDPOINTS)) {
    const start = Date.now();
    try {
      const res = await axios.post(
        url,
        { latitude: lat, longitude: lon },
        {
          headers: {
            Authorization: process.env.HF_TOKEN ? `Bearer ${process.env.HF_TOKEN}` : undefined,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const d = res.data || {};

      results[name] = {
        status: "online",
        latency: parseFloat(elapsed),
        temperature: d.temperature ?? d.temperature_2m ?? null,
        precipitation: d.precipitation ?? d.total_precipitation ?? 0,
        wind: d.wind ?? d.wind_10m ?? null
      };

      await addEngineLog(`🤖 ${name.toUpperCase()} online (${elapsed}s) – T:${results[name].temperature ?? "?"}`, "info", "aiModels");
    } catch (e) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      results[name] = {
        status: "offline",
        latency: parseFloat(elapsed),
        temperature: null,
        precipitation: null,
        wind: null
      };
      await addEngineError(`IA ${name.toUpperCase()} injoignable : ${e.message}`, "aiModels");
    }
  }

  // Fusion IA → moyenne simple pour pondération J.E.A.N.
  const valid = Object.values(results).filter((m) => m.status === "online" && m.temperature !== null);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const aiFusion = {
    temperature: avg(valid.map((m) => m.temperature)),
    precipitation: avg(valid.map((m) => m.precipitation)),
    wind: avg(valid.map((m) => m.wind)),
    reliability: +(valid.length / Object.keys(results).length).toFixed(2)
  };

  await addEngineLog(
    `🧠 Fusion IA externe → T:${aiFusion.temperature ?? "?"}°C | P:${aiFusion.precipitation ?? "?"}mm | V:${aiFusion.wind ?? "?"} km/h | R:${Math.round(aiFusion.reliability * 100)}%`,
    "success",
    "aiModels"
  );

  return { results, aiFusion };
}

export default { checkAIModels };
