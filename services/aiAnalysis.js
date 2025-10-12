// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v4.6 REAL HYBRID SELECTIVE)
// ==========================================================
// Analyse IA J.E.A.N. – Réelle, sélective, et totalement Render-compatible.
// Lecture uniquement des fichiers issus de la dernière extraction.
// ==========================================================

import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError, getLastExtraction } from "./engineState.js";
import { checkAIModels } from "./aiModelsChecker.js";

// ==========================================================
// 🧠 Fonction principale – IA J.E.A.N.
// ==========================================================
export async function runAIAnalysis() {
  try {
    const last = await getLastExtraction();
    if (!last || !last.files?.length) {
      await addEngineError("Aucune extraction trouvée pour analyse IA", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune extraction récente" };
    }

    const results = [];

    // ------------------------------------------------------
    // 📦 Lecture des fichiers extraits (dernière extraction)
    // ------------------------------------------------------
    for (const filePath of last.files) {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
          if (Array.isArray(content)) results.push(...content);
        }
      } catch (err) {
        await addEngineError(`Erreur lecture fichier IA : ${filePath} – ${err.message}`, "IA.JEAN");
      }
    }

    if (!results.length) {
      await addEngineError("Aucune donnée valide trouvée dans les fichiers récents", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Pas de données exploitables" };
    }

    // ------------------------------------------------------
    // 🧮 Analyse IA interne (indice de cohérence physique)
    // ------------------------------------------------------
    const valid = results.filter(r => r.temperature !== null);
    const indice = Math.min(100, Math.round((valid.length / results.length) * 100));
    const poidsRelief = Math.min(1.2, 1 + Math.abs(results[0].lat) / 90);
    let indiceGlobal = Math.round(indice * poidsRelief);

    // ------------------------------------------------------
    // 📅 Étape fraîcheur – pénalité selon les runs anciens
    // ------------------------------------------------------
    const total = valid.length || 1;
    const fresh = valid.filter(r => r.freshnessScore >= 80).length;
    const freshnessGlobal = Math.round((fresh / total) * 100);
    const penalty = Math.round((100 - freshnessGlobal) * 0.25);
    indiceGlobal = Math.max(0, indiceGlobal - penalty);

    await addEngineLog(
      `📅 Fraîcheur moyenne ${freshnessGlobal}% – pénalité ${penalty}% appliquée`,
      "info",
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

    // ------------------------------------------------------
    // 💾 Enregistrement du résultat IA
    // ------------------------------------------------------
    await addEngineLog(
      `🧩 IA J.E.A.N. – Indice final ${pondGlobal}% (${synthese}) – Zones : ${last.zones.join(", ")}`,
      "success",
      "IA.JEAN"
    );

    return {
      indiceGlobal: pondGlobal,
      synthese,
      freshnessGlobal,
      iaExterne,
      aiFusion,
      lastExtraction: last,
    };

  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

// ==========================================================
// 📤 Export
// ==========================================================
export default { runAIAnalysis };
