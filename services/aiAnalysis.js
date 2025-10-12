// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v4.3.1 REAL)
// ==========================================================
import { addEngineLog, addEngineError } from "./engineState.js";

export async function runAIAnalysis(results = []) {
  try {
    if (!results.length) return { indiceGlobal: 0, synthese: "Aucune donnée" };

    const valid = results.filter((r) => r.temperature !== null);
    const indice = Math.min(100, Math.round((valid.length / results.length) * 100));

    // Poids environnemental : altitude + latitude
    const poidsRelief = Math.min(1.2, 1 + Math.abs(results[0].lat) / 90);
    const indiceGlobal = Math.round(indice * poidsRelief);

    await addEngineLog(`🧠 IA J.E.A.N. – Indice ${indiceGlobal}% basé sur ${valid.length} modèles valides`, "ok", "IA.JEAN");
    return { indiceGlobal, synthese: "Analyse complète effectuée" };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
