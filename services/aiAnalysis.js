// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v4.4 REAL FULL AI-FUSION)
// ==========================================================
import { addEngineLog, addEngineError } from "./engineState.js";
import { checkAIModels } from "./aiModelsChecker.js"; // 🔗 nouvelle intégration IA externe

// ==========================================================
// 🧩 Analyse IA J.E.A.N. + validation modèles Hugging Face
// ==========================================================
export async function runAIAnalysis(results = []) {
  try {
    if (!results.length) return { indiceGlobal: 0, synthese: "Aucune donnée" };

    // ------------------------------------------------------
    // 🧠 Étape 1 : Analyse interne classique (températures validées)
    // ------------------------------------------------------
    const valid = results.filter((r) => r.temperature !== null);
    const indice = Math.min(100, Math.round((valid.length / results.length) * 100));
    const poidsRelief = Math.min(1.2, 1 + Math.abs(results[0].lat) / 90);
    const indiceGlobal = Math.round(indice * poidsRelief);

    await addEngineLog(
      `🧠 IA J.E.A.N. – Indice initial ${indiceGlobal}% basé sur ${valid.length} modèles physiques valides`,
      "ok",
      "IA.JEAN"
    );

    // ------------------------------------------------------
    // 🤖 Étape 2 : Vérification IA externe (GraphCast, Pangu, CorrDiff, NowcastNet)
    // ------------------------------------------------------
    const lat = results[0]?.lat ?? 0;
    const lon = results[0]?.lon ?? 0;

    const { results: iaExterne, aiFusion } = await checkAIModels(lat, lon);

    const fusionOK = aiFusion?.reliability > 0;
    if (fusionOK) {
      const deltaT = aiFusion.temperature - valid[0].temperature;
      const deltaP = aiFusion.precipitation - valid[0].precipitation;
      const deltaV = aiFusion.wind - valid[0].wind;

      await addEngineLog(
        `🤖 IA externe OK (${Math.round(aiFusion.reliability * 100)}%) – ΔT:${deltaT?.toFixed?.(1)}°C, ΔP:${deltaP?.toFixed?.(1)}mm, ΔV:${deltaV?.toFixed?.(1)} km/h`,
        "info",
        "IA.JEAN"
      );
    } else {
      await addEngineError("Aucune IA externe disponible – pondération non appliquée", "IA.JEAN");
    }

    // ------------------------------------------------------
    // 🧮 Étape 3 : Pondération finale IA J.E.A.N.
    // ------------------------------------------------------
    const pondGlobal = fusionOK
      ? Math.min(100, Math.round(((indiceGlobal + aiFusion.reliability * 100) / 2) * poidsRelief))
      : indiceGlobal;

    const synthese = fusionOK
      ? `Fusion IA réussie (${Math.round(aiFusion.reliability * 100)}% cohérence)`
      : "Analyse IA interne uniquement";

    await addEngineLog(
      `🧩 IA J.E.A.N. – Indice fusionné final ${pondGlobal}% (${synthese})`,
      "success",
      "IA.JEAN"
    );

    // ------------------------------------------------------
    // 🧾 Retour final Phase 2
    // ------------------------------------------------------
    return {
      indiceGlobal: pondGlobal,
      synthese,
      iaExterne,
      aiFusion
    };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
