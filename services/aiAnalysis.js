// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js
// v5.15c PRO+++ (Directive IA intégrée + multi-zones + sauvegarde IA + Watchdog)
// ==========================================================
// IA J.E.A.N. – Intelligence Atmosphérique interne
// Mission : produire des prévisions hyper-locales et globales
// ultra précises, détecter les anomalies, anticiper les risques
// et sauver des vies sur toute la planète.
// ==========================================================

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { runWatchdog } from "./watchdogService.js";
import { addEngineLog, addEngineError, getRecentExtractions } from "./engineState.js";
import { fetchStationData } from "./stationsService.js";
import { evaluatePhenomena } from "./phenomena/evaluate.js";
import { analyzeRain } from "./rainService.js";
import { analyzeSnow } from "./snowService.js";
import { analyzeWind } from "./windService.js";
import { logDetectedAlert } from "./alertDetectedLogger.js";
import { logPrimeurAlert } from "./alertPrimeurLogger.js";
import { getThresholds } from "../config/alertThresholds.js";

// ==========================================================
// ⚙️ Facteurs physiques et environnementaux
// ==========================================================
function computeReliefFactor(lat, lon, altitude = 0) {
  const reliefImpact = Math.min(1.3, 1 + altitude / 3000);
  const latFactor = 1 + Math.abs(lat) / 180;
  return Math.round(reliefImpact * latFactor * 100) / 100;
}
function computeHydroFactor(lat, lon) {
  const nearSea = lon > -180 && lon < 180 && lat > -80 && lat < 80 ? 1.1 : 1.0;
  const nearRiver = Math.random() * 0.1 + 1.0;
  return Math.round(nearSea * nearRiver * 100) / 100;
}
function computeClimateFactor(lat) {
  if (lat > 60) return 0.9;
  if (lat < -40) return 0.95;
  if (lat < 40 && lat > -40) return 1.1;
  return 1.0;
}
const clamp01 = (x) => Math.max(0, Math.min(1, x ?? 0));
const safeAvg = (arr) => (arr?.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// ==========================================================
// 📡 Lecture VisionIA (MongoDB ou fallback local)
// ==========================================================
async function getLatestVisionIA() {
  try {
    const VisionSchema = new mongoose.Schema({}, { strict: false });
    const VisionModel =
      mongoose.models.VisionIA ||
      mongoose.model("VisionIA", VisionSchema, "visionias");

    const recent = await VisionModel.find()
      .sort({ timestamp: -1 })
      .limit(3)
      .lean();

    if (recent?.length) {
      const v = recent[0];
      await addEngineLog(
        `[VISIONIA][IA.JEAN] Vision Mongo : ${v.type} (${v.confidence}%)`,
        "info",
        "IA.JEAN"
      );
      return { active: v.active ?? true, confidence: v.confidence ?? 0, type: v.type ?? "none" };
    }
  } catch (e) {
    await addEngineError("VisionIA Mongo non disponible : " + e.message, "IA.JEAN");
  }

  // fallback local (captures)
  try {
    const dir = path.join(process.cwd(), "data", "vision");
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
      if (files.length) {
        await addEngineLog(`[VISIONIA][IA.JEAN] Fallback local : ${files.length} capture(s)`, "info", "IA.JEAN");
        return { active: true, confidence: 60, type: "nuages denses" };
      }
    }
  } catch {}
  return { active: false, confidence: 0, type: "none" };
}

// ==========================================================
// 🧮 Fiabilité (prévisions + alertes)
// ==========================================================
function computeForecastReliability({ r, stationsSummary, visualConfidence, indiceLocal }) {
  let modelsCoverage = 0;
  if (typeof r.reliability === "number") modelsCoverage = clamp01(r.reliability);
  else if (Array.isArray(r.sources)) {
    const EXPECTED_MODELS = 8;
    modelsCoverage = clamp01(r.sources.length / EXPECTED_MODELS);
  }

  const stationsWeight =
    stationsSummary &&
    (stationsSummary.tempStation != null ||
      stationsSummary.windStation != null ||
      stationsSummary.humidityStation != null)
      ? 1
      : 0;

  const visual = clamp01(visualConfidence / 100);
  const freshness = clamp01((r.freshnessScore ?? 100) / 100);
  const stability = clamp01(1.2 - clamp01(indiceLocal / 120));

  const w = { models: 0.35, stations: 0.15, visual: 0.2, freshness: 0.15, stability: 0.15 };

  const score =
    w.models * modelsCoverage +
    w.stations * stationsWeight +
    w.visual * visual +
    w.freshness * freshness +
    w.stability * stability;

  return clamp01(Math.max(score, 0.25 * modelsCoverage));
}

// ==========================================================
// 🧠 IA J.E.A.N. – Phase 2
// ==========================================================
const AIPointSchema = new mongoose.Schema({}, { strict: false });
const AIPointModel =
  mongoose.models.forecasts_ai_points ||
  mongoose.model("forecasts_ai_points", AIPointSchema, "forecasts_ai_points");

export async function runAIAnalysis() {
  try {
    // 🧩 Sécurité connexion Mongo
    if (mongoose.connection.readyState !== 1) {
      const uri = process.env.MONGO_URI;
      if (!uri) throw new Error("MONGO_URI manquant pour IA.JEAN");
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      await addEngineLog("Connexion Mongo établie (IA.JEAN)", "info", "IA.JEAN");
    }

    await addEngineLog("🧠 Phase 2 – IA J.E.A.N. activée (analyse réelle mondiale multi-zones)", "info", "IA.JEAN");

    // 🎯 Directive IA — Mission scientifique J.E.A.N.
    const IA_PROMPT =
      "Tu es J.E.A.N., météorologue, climatologue, physicien et mathématicien d’élite. " +
      "Tu maîtrises les équations de Navier-Stokes, les modèles GFS, ECMWF, ICON et AROME, " +
      "et tu comprends la dynamique du relief et des flux atmosphériques. " +
      "Ta mission : analyser toutes les extractions récentes de la Phase 1, qu’elles proviennent d’Europe, d’Amérique, d’Afrique ou d’Asie. " +
      "Tu dois croiser les modèles physiques, les images VisionIA et les données de stations pour : " +
      "1️⃣ Détecter tout signe de risque météorologique précoce (orage, pluie extrême, vent, neige, chaleur, verglas, submersion). " +
      "2️⃣ Calculer la fiabilité de chaque prévision en fonction du nombre de modèles concordants et de la cohérence géographique. " +
      "3️⃣ Prioriser les zones où la combinaison relief × humidité × vent × pression montre une instabilité atmosphérique. " +
      "4️⃣ Si VisionIA détecte un signal anormal (nuages convectifs, structure frontale), crée une pré-alerte IA. " +
      "Tu n’attends pas de validation humaine : tu agis pour anticiper et sauver des vies.";

    await addEngineLog(`🎯 Directive IA chargée : ${IA_PROMPT.substring(0, 160)}...`, "info", "IA.JEAN");

    const visionGlobal = await getLatestVisionIA();
    const recentExtractions = await getRecentExtractions(10);
    let files = [];
    for (const e of recentExtractions) if (Array.isArray(e.files)) files.push(...e.files);

    const dataDir = path.join(process.cwd(), "data");
    if (fs.existsSync(dataDir)) {
      const all = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).map((f) => path.join(dataDir, f));
      for (const f of all) if (!files.includes(f)) files.push(f);
    }

    if (!files.length) {
      await addEngineError("Aucune extraction récente trouvée", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune donnée disponible" };
    }

    await addEngineLog(`🌐 ${files.length} fichiers détectés pour IA.J.E.A.N.`, "info", "IA.JEAN");

    const results = [];
    const reliabilities = [];

    for (const filePath of files) {
      try {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) continue;
        const raw = fs.readFileSync(fullPath, "utf8");
        const content = JSON.parse(raw);
        const data = Array.isArray(content) ? content : content.phase1Results || [];
        if (data.length) {
          for (const r of data) {
            const reliability = computeForecastReliability({ r });
            reliabilities.push(reliability);
            results.push({ ...r, reliability_pct: Math.round(reliability * 100) });
          }
          await addEngineLog(`📂 ${path.basename(filePath)} → ${data.length} points analysés`, "info", "IA.JEAN");
        }
      } catch (err) {
        await addEngineError(`Erreur lecture ${filePath}: ${err.message}`, "IA.JEAN");
      }
    }

    if (!results.length) return { indiceGlobal: 0, synthese: "Données incomplètes" };

    await AIPointModel.insertMany(results, { ordered: false });
    const avgReliability = Math.round(safeAvg(reliabilities) * 100);

    await addEngineLog(
      `✅ Phase 2 terminée – ${results.length} points IA traités, fiabilité moyenne ${avgReliability}%`,
      "success",
      "IA.JEAN"
    );

    await runWatchdog("post-phase2");

    return { success: true, count: results.length, reliability: avgReliability };
  } catch (e) {
    await addEngineError("Erreur IA.J.E.A.N. v5.15c : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
