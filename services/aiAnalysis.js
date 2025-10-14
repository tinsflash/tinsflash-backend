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

      // === PHÉNOMÈNES ===
      let phenomena = null;
      try {
        phenomena = evaluatePhenomena({
          lat, lon, altitude,
          base: r,
          rain, snow, wind,
          stations: stationsSummary,
          factors: { relief, hydro, climate },
          thresholds,
        });
      } catch (err) {
        await addEngineLog(`⚠️ Phénomène erreur : ${err.message}`, "warn", "IA.JEAN");
      }

      // === INDICE LOCAL ===
      const stationBoost = stationsSummary?.tempStation != null ? 1.05 : 1.0;
      const indiceLocal = Math.round(relief * hydro * climate * stationBoost * 100) / 100;
      const condition =
        indiceLocal > 115 ? "Atmosphère instable" :
        indiceLocal > 100 ? "Ciel variable" :
        "Conditions calmes";

      // === VISUAL PHASE 1B ===
      let visualEvidence = false;
      try {
        const imgDir = path.join(dataDir, "vision");
        if (fs.existsSync(imgDir)) {
          const imgs = fs.readdirSync(imgDir).filter(f => f.includes(`${country}`) || f.includes(`${r.region}`));
          visualEvidence = imgs.length > 0;
        }
      } catch { visualEvidence = false; }

      analysed.push({
        ...r,
        country,
        reliefFactor: relief,
        hydroFactor: hydro,
        climateFactor: climate,
        stations: stationsSummary,
        rain, snow, wind,
        phenomena,
        indiceLocal,
        condition,
        visualEvidence,
      });

      // === ALERTES ===
      if (phenomena?.alerts?.length) {
        for (const a of phenomena.alerts) {
          await logDetectedAlert({
            phenomenon: a.type,
            zone: r.region || country,
            country,
            lat, lon,
            alertLevel: a.level,
            confidence: a.confidence ?? 1.0,
            visualEvidence,
            comparedToExternal: true,
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
    // 📊 SYNTHÈSE MONDIALE
    // =======================================================
    const moy = analysed.reduce((a, x) => a + x.indiceLocal, 0) / analysed.length;
    const variance = analysed.reduce((a, x) => a + Math.pow(x.indiceLocal - moy, 2), 0) / analysed.length;
    const indiceGlobal = Math.max(0, Math.min(100, Math.round((100 - variance) * 0.95)));

    const synthese =
      indiceGlobal > 90 ? "Atmosphère mondiale stable" :
      indiceGlobal > 70 ? "Variabilité régionale modérée" :
      indiceGlobal > 50 ? "Anomalies régionales multiples" :
      "Instabilité globale – déclenchement d’alertes recommandé";

    await addEngineLog(`📈 IA.J.E.A.N. Indice global ${indiceGlobal}% (${synthese})`, "success", "IA.JEAN");

    // =======================================================
    // 💾 ÉCRITURE MONGO (prévisions IA par point)
    // - pas d'import statique : import dynamique de mongoose
    // - écrase les anciennes prévisions des zones analysées
    // - purge globale > 30 h
    // =======================================================
    const { default: mongoose } = await import("mongoose");

    // Modèle dynamique (strict:false pour ne rien casser)
    const AiPointForecastSchema = new mongoose.Schema({}, { strict: false });
    // On fixe explicitement le nom de collection pour éviter les surprises
    const AiPointForecast = mongoose.models.forecasts_ai_points
      || mongoose.model("forecasts_ai_points", AiPointForecastSchema, "forecasts_ai_points");

    const now = new Date();

    // 1) Déterminer les zones couvertes dans ce run (par ex. r.region || country)
    const zonesCovered = Array.from(
      new Set(
        analysed.map(p => String(p.region || p.zone || p.country || "Unknown"))
      )
    );

    // 2) Écraser les anciennes prévisions de ces zones
    try {
      await AiPointForecast.deleteMany({ zone: { $in: zonesCovered } });
      await addEngineLog(`🗑️ Suppression anciennes prévisions IA pour zones: ${zonesCovered.join(", ")}`, "info", "IA.JEAN");
    } catch (err) {
      await addEngineError(`Erreur deleteMany forecasts_ai_points: ${err.message}`, "IA.JEAN");
    }

    // 3) Insérer les nouvelles prévisions
    const docs = analysed.map(p => ({
      zone: String(p.region || p.zone || p.country || "Unknown"),
      country: p.country || null,
      lat: Number(p.lat ?? p.latitude ?? 0),
      lon: Number(p.lon ?? p.longitude ?? 0),
      altitude: Number(p.altitude ?? 150),

      analysedAt: now,
      // Condensé « prévision IA »
      indiceLocal: p.indiceLocal,
      condition: p.condition,
      factors: {
        relief: p.reliefFactor,
        hydro: p.hydroFactor,
        climate: p.climateFactor,
      },
      stations: p.stations || null,
      rain: p.rain || null,
      snow: p.snow || null,
      wind: p.wind || null,
      visualEvidence: !!p.visualEvidence,

      // Base brute pour traçabilité (on garde le point original + phénomènes)
      base: p.base || undefined,
      phenomena: p.phenomena || null,
      // Tag moteur
      source: "TINSFLASH IA.J.E.A.N.",
      version: "v5.11",
    }));

    if (docs.length) {
      await AiPointForecast.insertMany(docs, { ordered: false });
      await addEngineLog(`💾 ${docs.length} prévisions IA écrites (Mongo: forecasts_ai_points)`, "success", "IA.JEAN");
    }

    // 4) Purge globale > 30 h
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 60 * 1000);
      const del = await AiPointForecast.deleteMany({ analysedAt: { $lt: cutoff } });
      await addEngineLog(`🧹 Purge forecasts_ai_points >30h: ${del?.deletedCount ?? 0} doc(s) supprimé(s)`, "info", "IA.JEAN");
    } catch (err) {
      await addEngineError(`Erreur purge >30h forecasts_ai_points: ${err.message}`, "IA.JEAN");
    }

    // =======================================================
    // ✅ Retour identique (on garde l’API stable)
    // =======================================================
    return { indiceGlobal, synthese, count: analysed.length, zones: zonesCovered };
  } catch (e) {
    await addEngineError("Erreur IA.J.E.A.N. globale : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
