// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v5.7 REAL GLOBAL CONNECT – PHASE 2 FINALE)
// ==========================================================
// IA J.E.A.N. – Intelligence Atmosphérique interne
// Mission : produire des prévisions hyper-locales ultra précises,
// détecter les anomalies, anticiper les risques, et sauver des vies.
// ==========================================================

import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError, getLastExtraction } from "./engineState.js";
import { fetchStationData } from "./stationsService.js";
import { evaluatePhenomena } from "./phenomena/evaluate.js";
import { analyzeRain } from "./rainService.js";
import { analyzeSnow } from "./snowService.js";
import { analyzeWind } from "./windService.js";

// ==========================================================
// 🧮 Facteurs physiques et environnementaux
// ==========================================================
function computeReliefFactor(lat, lon, altitude = 0) {
  const reliefImpact = Math.min(1.3, 1 + altitude / 3000);
  const latFactor = 1 + Math.abs(lat) / 180;
  return Math.round(reliefImpact * latFactor * 100) / 100;
}
function computeHydroFactor(lat, lon) {
  const nearSea = lon > -5 && lon < 15 && lat > 45 && lat < 55 ? 1.1 : 1.0;
  const nearRiver = Math.random() * 0.1 + 1.0;
  return Math.round(nearSea * nearRiver * 100) / 100;
}
function computeClimateFactor(lat) {
  if (lat > 60) return 0.9;
  if (lat < 40) return 1.1;
  return 1.0;
}
function safeAvg(arr) {
  if (!arr || !arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ==========================================================
// 🧠 IA J.E.A.N. – Phase 2 : Analyse interne réelle
// ==========================================================
export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 Phase 2 – Démarrage IA J.E.A.N. interne", "info", "IA.JEAN");
    await addEngineLog("🌍 IA J.E.A.N. initialisée – mission humanitaire activée", "info", "IA.JEAN");

    // =======================================================
    // 🔎 Recherche dynamique du fichier Phase 1 (corrigée)
    // =======================================================
    let files = [];
    const dataDir = path.join(process.cwd(), "data");

    try {
      const last = await getLastExtraction();

      // 🟢 Si getLastExtraction contient un chemin relatif (ex: data/bouke.json)
      if (last?.files?.length) {
        files = last.files.map(f => {
          const absPath = path.isAbsolute(f)
            ? f
            : path.join(dataDir, path.basename(f)); // assure chemin complet
          return fs.existsSync(absPath) ? absPath : null;
        }).filter(Boolean);
      }

      // 🟠 Si rien trouvé, on récupère le plus récent fichier JSON du dossier /data
      if (!files.length && fs.existsSync(dataDir)) {
        const all = fs.readdirSync(dataDir)
          .filter(f => f.endsWith(".json"))
          .map(f => ({ f, t: fs.statSync(path.join(dataDir, f)).mtimeMs }))
          .sort((a, b) => b.t - a.t);
        if (all.length) {
          const latest = path.join(dataDir, all[0].f);
          files.push(latest);
          await addEngineLog(`🔁 Aucun fichier Phase 1 déclaré – utilisation du plus récent (${all[0].f})`, "info", "IA.JEAN");
        }
      }

      if (!files.length) {
        await addEngineError("Aucun fichier Phase 1 trouvé dans /data", "IA.JEAN");
        return { indiceGlobal: 0, synthese: "Pas de données Phase 1 trouvées" };
      }
    } catch (err) {
      await addEngineError("Erreur récupération extraction : " + err.message, "IA.JEAN");
    }

    const results = [];

    // =======================================================
    // 📦 Lecture stricte des fichiers d’extraction
    // =======================================================
    for (const filePath of files) {
      try {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) continue;
        const raw = fs.readFileSync(fullPath, "utf8");
        if (!raw) continue;

        const content = JSON.parse(raw);
        const data = Array.isArray(content) ? content : content.phase1Results || [];
        results.push(...data);
        await addEngineLog(`📂 Données chargées depuis ${path.basename(filePath)} (${data.length} points)`, "info", "IA.JEAN");
      } catch (err) {
        await addEngineError(`Erreur lecture fichier ${filePath}: ${err.message}`, "IA.JEAN");
      }
    }

    if (!results.length) {
      await addEngineError("A
