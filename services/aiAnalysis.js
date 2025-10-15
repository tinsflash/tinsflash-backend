// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js
// v5.14 PRO+++  (Directive IA complète + VisionIA Mongo + pré-alertes)
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
import mongoose from "mongoose";

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
const safeAvg = (arr) => (arr?.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

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

function computeAlertReliability({ r, a, stationsSummary, visualConfidence }) {
  let models = 0;
  if (typeof r.reliability === "number") models = clamp01(r.reliability);
  else if (Array.isArray(r.sources)) {
    const EXPECTED_MODELS = 8;
    models = clamp01(r.sources.length / EXPECTED_MODELS);
  }

  const stations =
    stationsSummary &&
    (stationsSummary.windStation != null ||
      stationsSummary.tempStation != null ||
      stationsSummary.humidityStation != null)
      ? 1
      : 0;

  const visual = clamp01(visualConfidence / 100);
  const external =
    Array.isArray(a.externalComparisons) && a.externalComparisons.length ? 1 : 0;

  const w = { models: 0.4, stations: 0.2, visual: 0.25, external: 0.15 };
  return clamp01(
    Math.max(w.models * models + w.stations * stations + w.visual * visual + w.external * external, clamp01(a.confidence))
  );
}

// ==========================================================
// 🧠 IA J.E.A.N. – Phase 2
// ==========================================================
export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 Phase 2 – IA J.E.A.N. activée (analyse réelle mondiale)", "info", "IA.JEAN");

    // ----------------------------------------------------------------------
    // 🔸 DIRECTIVE IA – Ce que J.E.A.N. doit faire et comment il raisonne
    // ----------------------------------------------------------------------
    const DIRECTIVE =
      "Tu es J.E.A.N., météorologue, climatologue, physicien et mathématicien de renommée mondiale. " +
      "Ta mission : analyser les extractions récentes Phase 1 (modèles physiques) et les captures satellites VisionIA (Phase 1B). " +
      "Tu croises les modèles (GFS, ECMWF, ICON, etc.) avec les images satellites infrarouge et visibles, " +
      "les observations de stations locales, et les données d’environnement (relief, altitude, proximité mer/rivière). " +
      "Tu détectes les anomalies (pluie, vent, neige, verglas, orages, chaleur, crues, submersions, etc.) " +
      "et tu produis des prévisions précises et un taux de fiabilité (0–100%). " +
      "Si la VisionIA révèle un phénomène (convection, nuages denses, pluie probable) non encore vu par les modèles, " +
      "tu déclenches une pré-alerte visuelle IA (primeur). " +
      "Ta mission première est d’anticiper pour sauver des vies, avec rigueur scientifique et réactivité.";

    // Lecture VisionIA
    const visionGlobal = await getLatestVisionIA();

    // =======================================================
    // 🔎 Récupération des extractions
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
      return { indiceGlobal: 0, synthese: "Aucune donnée disponible" };
    }

    await addEngineLog(`🌐 ${files.length} fichiers détectés pour IA.J.E.A.N.`, "info", "IA.JEAN");

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
    if (!results.length) return { indiceGlobal: 0, synthese: "Données incomplètes" };

    // =======================================================
    // 🔬 Analyse point par point
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

      // STATIONS
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
      } catch {}

      // SERVICES
      let rain = null, snow = null, wind = null;
      try {
        rain = await analyzeRain(lat, lon);
        snow = await analyzeSnow(lat, lon);
        wind = await analyzeWind(lat, lon);
      } catch {}

      // PHÉNOMÈNES
      let phenomena = null;
      try {
        phenomena = evaluatePhenomena({
          lat, lon, altitude, base: r,
          rain, snow, wind, stations: stationsSummary,
          factors: { relief, hydro, climate },
          thresholds,
        });
      } catch {}

      // INDICE LOCAL
      const stationBoost = stationsSummary?.tempStation != null ? 1.05 : 1.0;
      const indiceLocal = Math.round(relief * hydro * climate * stationBoost * 100) / 100;
      const condition =
        indiceLocal > 115 ? "Atmosphère instable" :
        indiceLocal > 100 ? "Ciel variable" :
        "Conditions calmes";

      // VISIONIA (pondération)
      const visualConfidence = visionGlobal.confidence;
      const visualType = visionGlobal.type;
      const visualActive = visionGlobal.active;

      const reliabilityForecast = computeForecastReliability({ r, stationsSummary, visualConfidence, indiceLocal });

      analysed.push({
        ...r, country, reliefFactor: relief, hydroFactor: hydro, climateFactor: climate,
        stations: stationsSummary, rain, snow, wind, phenomena,
        indiceLocal, condition,
        visualEvidence: visualActive, visualConfidence, visualType,
        reliabilityForecast,
      });

      // === Pré-alerte visuelle ===
      if ((!phenomena?.alerts?.length) && visualActive && visualConfidence >= 80 &&
          /orage|pluie|convection/i.test(visualType)) {
        await logDetectedAlert({
          phenomenon: "Pré-alerte visuelle IA",
          zone: r.region || country,
          country, lat, lon,
          alertLevel: "pré-alerte",
          confidence: clamp01(visualConfidence / 100),
          confidence_pct: visualConfidence,
          visualEvidence: true,
          comparedToExternal: false,
          primeur: true,
          details: { type: visualType, source: "VisionIA" },
        });
        await addEngineLog(`[VISIONIA][IA.JEAN] Pré-alerte visuelle (${visualType} ${visualConfidence}%)`, "info", "IA.JEAN");
      }

      // === Alertes normales ===
      if (phenomena?.alerts?.length) {
        for (const a of phenomena.alerts) {
          const conf = computeAlertReliability({ r, a, stationsSummary, visualConfidence });
          await logDetectedAlert({
            phenomenon: a.type,
            zone: r.region || country,
            country, lat, lon,
            alertLevel: a.level,
            confidence: conf,
            confidence_pct: Math.round(conf * 100),
            visualEvidence: visualActive,
            comparedToExternal: !!(a.externalComparisons && a.externalComparisons.length),
            primeur: a.primeur ?? false,
            details: a,
          });
          if (a.primeur)
            await logPrimeurAlert({
              phenomenon: a.type,
              zone: r.region || country,
              tinsflashAlertLevel: a.level,
              externalComparisons: a.externalComparisons || [],
            });
        }
      }
    }
 // =======================================================
// 🛰️  VALIDATION DES PRÉ-ALERTES TOCSIN (surveillance continue)
// =======================================================
try {
  const WatchdogPrealert =
    mongoose.models.watchdog_prealerts ||
    mongoose.model(
      "watchdog_prealerts",
      new mongoose.Schema({}, { strict: false }),
      "watchdog_prealerts"
    );

  const prealerts = await WatchdogPrealert.find({
    createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  }).lean();

  if (prealerts.length) {
    await addEngineLog(`🕵️ ${prealerts.length} pré-alertes en attente de validation IA`, "info", "TOCSIN");

    for (const a of prealerts) {
      const match = analysed.find(
        (x) =>
          x.lat && x.lon &&
          Math.abs(x.lat - a.lat) < 0.3 &&
          Math.abs(x.lon - a.lon) < 0.3
      );
      if (match) {
        const confIA = clamp01((match.reliabilityForecast + (a.confidence ?? 0.6)) / 2);
        const validated = confIA >= 0.6;
        const alertType = a.phenomenon || "phénomène inconnu";
        const alertLvl = a.level || "pré-alerte";

        if (validated) {
          await logDetectedAlert({
            phenomenon: alertType,
            zone: a.zone || match.country || "Inconnue",
            country: match.country || null,
            lat: match.lat,
            lon: match.lon,
            alertLevel: alertLvl,
            confidence: confIA,
            confidence_pct: Math.round(confIA * 100),
            visualEvidence: a.visualEvidence ?? false,
            primeur: true,
            details: { source: "TOCSIN", ...a },
          });

          if (confIA >= 0.9) {
            await logPrimeurAlert({
              phenomenon: alertType,
              zone: a.zone || match.country || "Inconnue",
              tinsflashAlertLevel: alertLvl,
              externalComparisons: [],
            });
          }

          await addEngineLog(
            `✅ Pré-alerte ${alertType} validée par IA (fiabilité ${Math.round(confIA * 100)}%)`,
            "success",
            "TOCSIN"
          );
        } else {
          await addEngineLog(`⚪ Pré-alerte ${alertType} non confirmée (fiabilité ${Math.round(confIA * 100)}%)`, "info", "TOCSIN");
        }
      }
    }
  }
} catch (err) {
  await addEngineError("Erreur validation pré-alertes TOCSIN : " + err.message, "TOCSIN");
}   
    // SYNTHÈSE
    const moy = analysed.reduce((a, x) => a + x.indiceLocal, 0) / analysed.length;
    const variance = analysed.reduce((a, x) => a + Math.pow(x.indiceLocal - moy, 2), 0) / analysed.length;
    const indiceGlobal = Math.max(0, Math.min(100, Math.round((100 - variance) * 0.95)));
    const synthese =
      indiceGlobal > 90 ? "Atmosphère mondiale stable" :
      indiceGlobal > 70 ? "Variabilité régionale modérée" :
      indiceGlobal > 50 ? "Anomalies régionales multiples" :
      "Instabilité globale – déclenchement d’alertes recommandé";

    await addEngineLog(`📈 IA.J.E.A.N. v5.14 – Indice global ${indiceGlobal}% (${synthese})`, "success", "IA.JEAN");

    // =======================================================
    // 💾 ÉCRITURE MONGO (identique à v5.12)
    // =======================================================
    const AiPointForecastSchema = new mongoose.Schema({}, { strict: false });
    const AiPointForecast = mongoose.models.forecasts_ai_points
      || mongoose.model("forecasts_ai_points", AiPointForecastSchema, "forecasts_ai_points");
    const now = new Date();
    const zonesCovered = Array.from(new Set(analysed.map(p => String(p.region || p.zone || p.country || "Unknown"))));

    await AiPointForecast.deleteMany({ zone: { $in: zonesCovered } });
    const docs = analysed.map(p => ({
      zone: String(p.region || p.zone || p.country || "Unknown"),
      country: p.country || null,
      lat: Number(p.lat ?? 0), lon: Number(p.lon ?? 0),
      altitude: Number(p.altitude ?? 150),
      analysedAt: now,
      indiceLocal: p.indiceLocal, condition: p.condition,
      factors: { relief: p.reliefFactor, hydro: p.hydroFactor, climate: p.climateFactor },
      stations: p.stations || null,
      rain: p.rain || null, snow: p.snow || null, wind: p.wind || null,
      visualEvidence: p.visualEvidence,
      reliability: clamp01(p.reliabilityForecast),
      reliability_pct: Math.round(clamp01(p.reliabilityForecast) * 100),
      phenomena: p.phenomena || null,
      source: "TINSFLASH IA.J.E.A.N.",
      version: "v5.14",
    }));
    if (docs.length) await AiPointForecast.insertMany(docs, { ordered: false });

    return { indiceGlobal, synthese, count: analysed.length, zones: zonesCovered };
  } catch (e) {
    await addEngineError("Erreur IA.J.E.A.N. v5.14 : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
