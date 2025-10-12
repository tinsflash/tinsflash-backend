// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v4.6 REAL HYBRID SELECTIVE)
// ==========================================================
import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError, getLastExtraction } from "./engineState.js";
import { checkAIModels } from "./aiModelsChecker.js";

// Fonction exportée
export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 Démarrage IA J.E.A.N. (lecture dernière extraction)", "info", "IA.JEAN");

    const last = await getLastExtraction();
    if (!last || !last.files?.length) {
      await addEngineError("Aucune extraction trouvée pour analyse IA", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune extraction récente" };
    }

    const results = [];

    // Lecture stricte des fichiers listés
    for (const filePath of last.files) {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          const contentRaw = fs.readFileSync(fullPath, "utf8");
          if (!contentRaw) continue;
          const content = JSON.parse(contentRaw);
          if (Array.isArray(content)) results.push(...content);
          else if (content?.phase1Results) results.push(...content.phase1Results);
          else if (content?.phase1Results?.phase1Results) results.push(...content.phase1Results.phase1Results);
          await addEngineLog(`📂 Chargé ${filePath} (${Array.isArray(content) ? content.length : (content.phase1Results?.length || 0)} pts)`, "info", "IA.JEAN");
        } else {
          await addEngineError(`Fichier introuvable : ${fullPath}`, "IA.JEAN");
        }
      } catch (err) {
        await addEngineError(`Erreur lecture fichier IA : ${filePath} – ${err.message}`, "IA.JEAN");
      }
    }

    if (!results.length) {
      await addEngineError("Aucune donnée valide trouvée dans les fichiers récents", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Pas de données exploitables" };
    }

    // Analyse interne
    const valid = results.filter(r => r.temperature !== null && typeof r.lat === "number" && typeof r.lon === "number");
    const indice = Math.min(100, Math.round((valid.length / results.length) * 100));
    const poidsRelief = Math.min(1.2, 1 + Math.abs(valid[0]?.lat ?? 0) / 90);
    let indiceGlobal = Math.round(indice * poidsRelief);

    // Fraîcheur
    const total = valid.length || 1;
    const fresh = valid.filter(r => (r.freshnessScore ?? 100) >= 80).length;
    const freshnessGlobal = Math.round((fresh / total) * 100);
    const penalty = Math.round((100 - freshnessGlobal) * 0.25);
    indiceGlobal = Math.max(0, indiceGlobal - penalty);

    await addEngineLog(`📅 Fraîcheur ${freshnessGlobal}% – pénalité ${penalty}% appliquée`, "info", "IA.JEAN");

    // IA externe
    const lat = valid[0]?.lat ?? 50;
    const lon = valid[0]?.lon ?? 4;
    const { results: iaExterne, aiFusion } = await checkAIModels(lat, lon);

    const fusionOK = aiFusion?.reliability > 0;
    if (fusionOK) {
      const deltaT = (aiFusion.temperature ?? 0) - (valid[0]?.temperature ?? 0);
      await addEngineLog(`🤖 IA externe OK (${Math.round(aiFusion.reliability * 100)}%) – ΔT:${deltaT.toFixed(1)}°C`, "info", "IA.JEAN");
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

    return { indiceGlobal: pondGlobal, synthese, freshnessGlobal, iaExterne, aiFusion, lastExtraction: last };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
