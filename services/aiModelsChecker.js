// ==========================================================
// 🌐 TINSFLASH – aiModelsChecker.js (v4.1 REAL CONNECT HF API)
// ==========================================================
// Utilise l'API Inference de Hugging Face avec ta clé (HF_API_KEY ou HF_TOKEN)
// pour contacter directement les 4 modèles IA TINSFLASH hébergés sur Hugging Face.
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

// On récupère la clé Hugging Face depuis Render (.env)
const HF_KEY = process.env.HF_API_KEY || process.env.HF_TOKEN || "";
const headers = HF_KEY ? { Authorization: `Bearer ${HF_KEY}` } : {};

// Modèles IA hébergés sur ton compte Hugging Face
const MODELS = {
  graphcast: "pynnaertpat/GraphCast-TINSFLASH",
  pangu: "pynnaertpat/Pangu-TINSFLASH",
  corrdiff: "pynnaertpat/CorrDiff-TINSFLASH",
  nowcastnet: "pynnaertpat/NowcastNet-TINSFLASH",
};

// Fonction interne qui appelle un modèle via l’API Hugging Face
async function callModel(model, payload) {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await axios.post(url, payload, { headers, timeout: 20000 });
  return res.data;
}

// Fonction principale : vérifie les IA et renvoie leurs résultats
export async function checkAIModels(lat, lon) {
  const results = {};
  let aiFusion = { reliability: 0 };

  for (const [name, model] of Object.entries(MODELS)) {
    try {
      const data = await callModel(model, { lat, lon });
      results[name] = data;
      await addEngineLog(`🤖 ${name} OK via HF API`, "info", "aiModelsChecker");
    } catch (err) {
      const code = err?.response?.status ?? "no-response";
      results[name] = { error: `HTTP ${code}`, detail: err.message };
      await addEngineError(`IA ${name} injoignable (HTTP ${code})`, "aiModelsChecker");
    }
  }

  // Fusion simple : moyenne des températures si disponibles
  const valid = Object.values(results).filter(
    (r) => !r.error && typeof r?.temperature === "number"
  );
  if (valid.length) {
    const avgT = valid.reduce((s, r) => s + r.temperature, 0) / valid.length;
    aiFusion = { reliability: valid.length / 4, temperature: avgT };
  }

  return { results, aiFusion };
}

export default { checkAIModels };
