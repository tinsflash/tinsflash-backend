// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js
// v5.11 REAL GLOBAL CONNECT + VISUAL PHASE 1B + Mongo Write
// ==========================================================
// IA J.E.A.N. – Intelligence Atmosphérique interne
// Mission : produire des prévisions hyper-locales et globales
// ultra précises, détecter les anomalies, anticiper les risques
// et sauver des vies sur toute la planète.
// ==========================================================

import fs from "fs";
import path from "path";
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
const safeAvg = (arr) => (arr?.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

// ==========================================================
// 🧠 IA J.E.A.N. – Phase 2 : Analyse interne réelle mondiale
// ==========================================================
export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 Phase 2 – IA J.E.A.N. activée (analyse réelle mondiale)", "info", "IA.JEAN");

    const DIRECTIVE =
      "Tu es J.E.A.N., météorologue, climatologue, physicien et mathématicien de renommée mondiale. " +
      "Ta mission est d'analyser les extractions récentes Phase 1 (modèles physiques) et les captures satellites Phase 1B. " +
      "Tu détectes les anomalies météorologiques (vent, pluie, neige, verglas, chaleur, orages, crues, submersions, etc.), " +
      "en tenant compte du relief, de l'altitude, du climat, de la proximité des mers et rivières. " +
      "Tu compares les résultats avec les stations météo locales et les sources officielles, " +
      "et tu produis des alertes précises, fiables et, si possible, avant les autres pour sauver des vies.";

    // =======================================================
    // 🔎 Récupération des extractions (<2 h)
    // =======================================================
    const recentExtractions = await getRecentExtractions(2);
    let files = [];
    for (const e of recentExtractions) if (Array.isArray(e.files)) files.push(...e.files);

    const dataDir = path.join(process.cwd(), "data");
    if (fs.existsSync(dataDir)) {
      const all = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).map((f) => path.join(dataDir, f));
      for (const f of all) if (!files.includes(f)) files.push(f);
    }

    if (!files.length) {
      await addEngineError("Aucune extraction récente trouvée", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune donnée récente disponible" };
    }

    await addEngineLog(`🌐 ${files.length} fichiers détectés pour analyse IA.J.E.A.N.`, "info", "IA.JEAN");

    // =======================================================
    // 📦 Lecture stricte
    // =======================================================
    const results = [];
    for (const filePath of files) {
      try {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) continue;
        const raw = fs.readFileSync(fullPath, "utf8");
        const content = JSON.parse(raw);
        const data = Array.isArray(content) ? content : content.phase1Results || [];
        if (data.length) {
          results.push(...data);
          await addEngineLog(`📂 ${path.basename(filePath)} → ${data.length} points`, "info", "IA.JEAN");
        }
      } catch (err) {
        await addEngineError(`Erreur lecture ${filePath}: ${err.message}`, "IA.JEAN");
      }
    }

    if (!results.length) {
      await addEngineError("Aucune donnée exploitable trouvée", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Données invalides ou incomplètes" };
    }

    // =======================================================
    // 🔬 Analyse globale par point
    // =======================================================
    const thresholds = getThresholds();
    const analysed = [];

    for (const r of results) {
      const lat = Number(r.lat ?? r.latitude ?? 0);
      const lon = Number(r.lon ?? r.longitude ?? 0);
      const altitude = Number(r.altitude ?? 150);
      const country = r.country || "Unknown";
      const relief = computeReliefFactor(lat, lon, altitude);
      const hydro = computeHydroFactor(lat, lon);
      const climate = computeClimateFactor(lat);

      // === STATIONS LOCALES ===
      let stationsSummary = null;
      try {
        const s = await fetchStationData(lat, lon, country, r.region || "");
        if (s?.data) {
          const temps = [], hums = [], winds = [], press = [];
          const pushIf = (v, arr) => typeof v === "number" && !isNaN(v) && arr.push(v);
          const entries = Array.isArray(s.data) ? s.data : [s.data];
          for (const e of entries) {
            pushIf(e.temperature_2m ?? e.temp, temps);
            pushIf(e.relative_humidity_2m ?? e.humidity, hums);
            pushIf(e.wind_speed_10m ?? e.wind_speed, winds);
            pushIf(e.pressure_msl ?? e.pressure, press);
          }
          stationsSummary = {
            tempStation: safeAvg(temps),
            humidityStation: safeAvg(hums),
            windStation: safeAvg(winds),
            pressureStation: safeAvg(press),
          };
        }
      } catch (err) {
        await addEngineLog(`⚠️ Station KO ${country}: ${err.message}`, "warn", "IA.JEAN");
      }

      // === SERVICES LOCAUX ===
      let rain = null, snow = null, wind = null;
      try {
        rain = await analyzeRain(lat, lon);
        snow = await analyzeSnow(lat, lon);
        wind = await analyzeWind(lat, lon);
      } catch (err) {
        await addEngineLog(`⚠️ Analyse additionnelle KO : ${err.message}`, "warn", "IA.JEAN");
      }

      // === PHÉNOMÈ
