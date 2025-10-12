// ==========================================================
// 🧠 TINSFLASH – services/aiHealth.js (v4.4 REAL FULL CONNECT)
// ==========================================================
// Vérifie en temps réel la santé et la latence des modèles IA
// Hugging Face utilisés pour la phase 2 (GraphCast, Pangu, CorrDiff, NowcastNet)
// ==========================================================
import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";

// Fonction générique pour ping un modèle HuggingFace
async function pingModel(modelId) {
  const start = Date.now();
  const apiKey = process.env.HF_TOKEN || "";
  const url = `https://api-inference.huggingface.co/models/${modelId}`;
  try {
    const res = await axios.post(
      url,
      { inputs: "ping" },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": "TINSFLASH-PRO+++",
        },
        timeout: 8000,
      }
    );
    const latency = (Date.now() - start) / 1000;
    const ok = res.status === 200;
    return { status: ok ? "online" : "offline", latency };
  } catch (e) {
    const latency = (Date.now() - start) / 1000;
    return { status: "offline", latency };
  }
}

// ==========================================================
// ✅ Vérification complète des IA externes
// ==========================================================
export async function checkAIHealth() {
  try {
    const [graphcast, pangu, corrdiff, nowcastnet] = await Promise.all([
      pingModel("openclimatefix/graphcast"),
      pingModel("HuggingFaceMeteo/pangu-weather"),
      pingModel("openclimatefix/corrdiff"),
      pingModel("deepmind/nowcastnet"),
    ]);

    const models = { graphcast, pangu, corrdiff, nowcastnet };
    const online = Object.values(models).filter((m) => m.status === "online").length;
    const status = online >= 3 ? "ok" : online >= 1 ? "warning" : "error";

    await addEngineLog(
      `🧠 IA Health – ${online}/4 modèles actifs (${status})`,
      "info",
      "IA.HEALTH"
    );

    return { status, ...models };
  } catch (err) {
    await addEngineError("Erreur checkAIHealth: " + err.message, "IA.HEALTH");
    return { status: "error", error: err.message };
  }
}
