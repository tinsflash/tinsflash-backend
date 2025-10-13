// ==========================================================
// 🔍 TINSFLASH – runAICompare.js (v4.0 REAL CONNECT – PHASE 4)
// ==========================================================
// Objectif : comparer les résultats de l’IA interne (Phase 2 – J.E.A.N.)
// et ceux des IA externes (Phase 3 – GraphCast, Pangu, CorrDiff, NowcastNet).
// 100 % optionnel : ne bloque jamais le moteur.
// ==========================================================

import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError } from "./engineState.js";

// ----------------------------------------------------------
// 📘 Lecture sécurisée d'un fichier JSON
// ----------------------------------------------------------
function loadJSON(filePath, label) {
  try {
    if (!fs.existsSync(filePath)) {
      addEngineError(`${label} introuvable`, "IA.COMP");
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    addEngineLog(`📂 Lecture ${label} (${Array.isArray(data) ? data.length : 1} éléments)`, "info", "IA.COMP");
    return data;
  } catch (err) {
    addEngineError(`Erreur lecture ${label} : ${err.message}`, "IA.COMP");
    return [];
  }
}

// ----------------------------------------------------------
// 🚀 Fonction principale
// ----------------------------------------------------------
export async function runAICompare() {
  await addEngineLog("🔍 Phase 4 – Démarrage comparaison IA interne/externe", "info", "IA.COMP");

  const dir = path.join(process.cwd(), "data");
  const fileJean = path.join(dir, "jean_analysis.json");
  const fileExt = path.join(dir, "phase3_external.json");

  const jean = loadJSON(fileJean, "IA interne J.E.A.N.");
  const externes = loadJSON(fileExt, "IA externes");

  if (!jean.length || !externes.length) {
    await addEngineError("Comparaison impossible : données manquantes", "IA.COMP");
    return { success: false, message: "Pas de données suffisantes" };
  }

  // --------------------------------------------------------
  // 🧮 Analyse mathématique
  // --------------------------------------------------------
  let deltaTemp = 0;
  let count = 0;
  const compareResults = [];

  for (const ext of externes) {
    if (typeof ext.tempBias !== "number") continue;
    const base = jean[count % jean.length];
    const delta = Math.abs((base.temperature ?? 0) - (ext.tempBias ?? 0));
    compareResults.push({
      model: ext.model,
      deltaTemp: delta,
      reliability: ext.reliability ?? 0,
    });
    deltaTemp += delta;
    count++;
  }

  const moyDelta = count ? (deltaTemp / count).toFixed(2) : 0;
  const moyenneFiabilite =
    compareResults.reduce((a, b) => a + (b.reliability || 0), 0) / (compareResults.length || 1);

  // --------------------------------------------------------
  // 🧠 Synthèse intelligente
  // --------------------------------------------------------
  let conclusion = "";
  if (moyenneFiabilite > 80 && moyDelta < 1)
    conclusion = "Excellente concordance entre IA J.E.A.N. et modèles externes.";
  else if (moyenneFiabilite > 60 && moyDelta < 2)
    conclusion = "Bonne cohérence globale, ajustements mineurs recommandés.";
  else if (moyDelta >= 2)
    conclusion = "Divergences significatives – recalibrage IA interne conseillé.";
  else
    conclusion = "Résultats mitigés, nouvelle comparaison nécessaire.";

  await addEngineLog(
    `📊 Phase 4 terminée – ΔTmoy=${moyDelta}°C | fiabilité=${moyenneFiabilite.toFixed(1)}%`,
    "success",
    "IA.COMP"
  );
  await addEngineLog(`🧠 Synthèse : ${conclusion}`, "info", "IA.COMP");

  // --------------------------------------------------------
  // 💾 Sauvegarde locale
  // --------------------------------------------------------
  const resultFile = path.join(dir, "phase4_compare.json");
  fs.writeFileSync(
    resultFile,
    JSON.stringify({ compareResults, moyDelta, moyenneFiabilite, conclusion }, null, 2),
    "utf8"
  );

  return { success: true, moyDelta, moyenneFiabilite, conclusion, file: resultFile };
}

// ----------------------------------------------------------
// 📤 Export
// ----------------------------------------------------------
export default { runAICompare };
