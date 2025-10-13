// ==========================================================
// 🤖 TINSFLASH – checkAIModels.js (v4.7 PRO+++ REAL SAFE)
// ==========================================================
// Objectif : appeler les 4 modèles IA externes sans jamais bloquer le moteur.
// Chaque appel est protégé par timeout et journalisé.
// ==========================================================

import fetch from "node-fetch";
import { addEngineLog, addEngineError } from "./engineState.js";

// Appel sécurisé avec timeout
async function safeFetch(url, label) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await addEngineLog(`🌐 ${label} OK`, "info", "IA.External");
    return data;
  } catch (err) {
    await addEngineError(`⚠️ ${label} KO : ${err.message}`, "IA.External");
    return { model: label, reliability: 0, temperature: null };
  }
}

// Fonction principale
export async function checkAIModels(lat = 50.4, lon = 4.8) {
  await addEngineLog("🚀 Vérification modèles IA externes", "info", "IA.External");

  const endpoints = [
    { name: "GraphCast", url: `https://api.tinsflash.ai/graphcast?lat=${lat}&lon=${lon}` },
    { name: "Pangu", url: `https://api.tinsflash.ai/pangu?lat=${lat}&lon=${lon}` },
    { name: "CorrDiff", url: `https://api.tinsflash.ai/corrdiff?lat=${lat}&lon=${lon}` },
    { name: "NowcastNet", url: `https://api.tinsflash.ai/nowcastnet?lat=${lat}&lon=${lon}` },
  ];

  const results = [];
  for (const ep of endpoints) {
    const r = await safeFetch(ep.url, ep.name);
    results.push({ ...r, model: ep.name });
  }

  // Fusion simple
  const valid = results.filter(r => (r.reliability || 0) > 0);
  const aiFusion = valid.length
    ? {
        temperature: valid.reduce((a, b) => a + (b.temperature ?? 0), 0) / valid.length,
        reliability: Math.min(1, valid.reduce((a, b) => a + b.reliability, 0) / valid.length),
      }
    : { temperature: null, reliability: 0 };

  await addEngineLog(
    `🧮 Fusion IA externes – fiabilité ${Math.round(aiFusion.reliability * 100)}%`,
    "success",
    "IA.External"
  );

  return { results, aiFusion };
}

export default { checkAIModels };
