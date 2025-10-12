// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v4.5 REAL FRESHNESS-AWARE)
// ==========================================================
import { addEngineLog, addEngineError } from "./engineState.js";
import { checkAIModels } from "./aiModelsChecker.js";

export async function runAIAnalysis(results = []) {
  try {
    if (!results.length) return { indiceGlobal: 0, synthese: "Aucune donnée" };

    const valid = results.filter((r) => r.temperature !== null);
    const indice = Math.min(100, Math.round((valid.length / results.length) * 100));
    const poidsRelief = Math.min(1.2, 1 + Math.abs(results[0].lat) / 90);
    let indiceGlobal = Math.round(indice * poidsRelief);

    // ------------------------------------------------------
    // 📅 Étape fraîcheur – pénalité selon les runs anciens
    // ------------------------------------------------------
    const total = valid.length || 1;
    const fresh = valid.filter((r) => r.freshnessScore >= 80).length;
    const freshnessGlobal = Math.round((fresh / total) * 100);
    const penalty = Math.round((100 - freshnessGlobal) * 0.25); // pénalité douce
    indiceGlobal = Math.max(0, indiceGlobal - penalty);

    await addEngineLog(
      `📅 Fraîcheur moyenne ${freshnessGlobal}% – pénalité ${penalty}% appliquée`,
      "info",
      "IA.JEAN"
    );
    await addEngineLog(
      `🧠 IA J.E.A.N. – Indice ajusté (physique + fraîcheur) ${indiceGlobal}%`,
      "ok",
      "IA.JEAN"
    );

    // ------------------------------------------------------
    // 🤖 Étape IA externe (GraphCast, Pangu, etc.)
    // ------------------------------------------------------
    const lat = results[0]?.lat ?? 0;
    const lon = results[0]?.lon ?? 0;
    const { results: iaExterne, aiFusion } = await checkAIModels(lat, lon);

    const fusionOK = aiFusion?.reliability > 0;
    if (fusionOK) {
      const deltaT = aiFusion.temperature - valid[0].temperature;
      await addEngineLog(
        `🤖 IA externe OK (${Math.round(aiFusion.reliability * 100)}%) – ΔT:${deltaT?.toFixed?.(1)}°C`,
        "info",
        "IA.JEAN"
      );
    } else {
      await addEngineError("Aucune IA externe disponible – pondération non appliquée", "IA.JEAN");
    }

    const pondGlobal = fusionOK
      ? Math.min(100, Math.round(((indiceGlobal + aiFusion.reliability * 100) / 2) * poidsRelief))
      : indiceGlobal;

    const synthese = fusionOK
      ? `Fusion IA réussie (${Math.round(aiFusion.reliability * 100)}% cohérence)`
      : "Analyse IA interne uniquement";

    await addEngineLog(`🧩 IA J.E.A.N. – Indice final ${pondGlobal}% (${synthese})`, "success", "IA.JEAN");

    return { indiceGlobal: pondGlobal, synthese, freshnessGlobal, iaExterne, aiFusion };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
