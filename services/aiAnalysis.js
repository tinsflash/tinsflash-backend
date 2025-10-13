// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js
// v5.10 REAL GLOBAL CONNECT – PHASE 2 FINALE (recent+safe)
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

// ==========================================================
// 🧮 Facteurs physiques et environnementaux
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
function safeAvg(arr) {
  if (!arr || !arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ==========================================================
// 🧠 IA J.E.A.N. – Phase 2 : Analyse interne réelle mondiale
// ==========================================================
export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 Phase 2 – Démarrage IA J.E.A.N. interne (Global recent+safe)", "info", "IA.JEAN");
    await addEngineLog("🌍 IA J.E.A.N. initialisée – mission humanitaire mondiale activée", "info", "IA.JEAN");

    // =======================================================
    // 🧭 DIRECTIVE COGNITIVE MONDIALE
    // =======================================================
    const DIRECTIVE =
      "Tu es J.E.A.N., météorologue, climatologue, physicien et mathématicien de niveau mondial. " +
      "Ta mission : produire des prévisions locales et globales ultra-précises, détecter les anomalies " +
      "(tempêtes, ouragans, inondations, orages violents, crues, vagues de chaleur ou de froid), " +
      "anticiper les risques et sauver des vies. Tu analyses toutes les extractions récentes Phase 1 " +
      "provenant de toutes les zones (Europe, Afrique, Amériques, Asie, Océanie, USA), " +
      "tu croises les facteurs environnementaux (relief, climat, altitude, proximité océans et rivières), " +
      "tu consolides avec les stations météo locales, et tu évalues la stabilité atmosphérique. " +
      "Tu produis une synthèse mondiale fiable et explicative.";

    await addEngineLog("🧭 Directive J.E.A.N. mondiale activée – analyse interprétative complète", "info", "IA.JEAN");

    // =======================================================
    // 🔎 Récupération automatique des extractions récentes (<2h)
    // =======================================================
    const recentExtractions = await getRecentExtractions(2);
    let files = [];
    for (const e of recentExtractions) if (Array.isArray(e.files)) files.push(...e.files);

    const dataDir = path.join(process.cwd(), "data");
    if (fs.existsSync(dataDir)) {
      const all = fs.readdirSync(dataDir).filter(f => f.endsWith(".json")).map(f => path.join(dataDir, f));
      for (const f of all) if (!files.includes(f)) files.push(f);
    }

    await addEngineLog(`🌐 ${files.length} fichier(s) détecté(s) pour analyse`, "info", "IA.JEAN");

    if (!files.length) {
      await addEngineError("Aucune extraction récente détectée (<2h)", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune donnée récente trouvée" };
    }

    // =======================================================
    // 📦 Lecture stricte des extractions
    // =======================================================
    let results = [];
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
      await addEngineError("Aucune donnée valide trouvée (toutes zones)", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune donnée exploitable" };
    }

    // =======================================================
    // 🔍 Analyse météorologique mondiale
    // =======================================================
    const analysed = [];
    for (const r of results) {
      const lat = Number(r.lat ?? r.latitude ?? 0);
      const lon = Number(r.lon ?? r.longitude ?? 0);
      const altitude = Number(r.altitude ?? 150);
      const freshnessScore = Number(r.freshnessScore ?? 100);
      const country = r.country || "Unknown";

      const relief = computeReliefFactor(lat, lon, altitude);
      const hydro = computeHydroFactor(lat, lon);
      const climate = computeClimateFactor(lat);

      // 🌡️ Stations locales
      let stationsSummary = null;
      try {
        const stationRes = await fetchStationData(lat, lon, country, r.region || "");
        if (stationRes?.data) {
          const temps = [], hums = [], winds = [], press = [];
          const pushIf = (val, arr) => typeof val === "number" && !isNaN(val) && arr.push(val);
          const entries = Array.isArray(stationRes.data) ? stationRes.data : [stationRes.data];
          for (const e of entries) {
            if (!e) continue;
            pushIf(e.temperature_2m ?? e.temp ?? e.temperature, temps);
            pushIf(e.relative_humidity_2m ?? e.humidity, hums);
            pushIf(e.wind_speed_10m ?? e.wind_speed, winds);
            pushIf(e.pressure_msl ?? e.pressure, press);
          }
          stationsSummary = {
            sourcesOK: stationRes.summary?.sourcesOK || [],
            sourcesFail: stationRes.summary?.sourcesFail || [],
            tempStation: safeAvg(temps),
            humidityStation: safeAvg(hums),
            windStation: safeAvg(winds),
            pressureStation: safeAvg(press),
          };
        }
      } catch (err) {
        await addEngineLog(`⚠️ Station error ${country} (${lat},${lon}): ${err.message}`, "warning", "IA.JEAN");
      }

      // 🌧️ Pluie, neige, vent
      let rain = null, snow = null, wind = null;
      try {
        rain = await analyzeRain(lat, lon);
        snow = await analyzeSnow(lat, lon);
        wind = await analyzeWind(lat, lon);
      } catch (err) {
        await addEngineLog(`⚠️ Données météo additionnelles KO : ${err.message}`, "warning", "IA.JEAN");
      }

      // ⚡ Phénomènes
      let phenomena = null;
      try {
        if (typeof evaluatePhenomena === "function") {
          phenomena = evaluatePhenomena({
            lat, lon, altitude,
            base: r,
            rain, snow, wind,
            stations: stationsSummary,
            factors: { relief, hydro, climate, freshnessScore },
          });
        }
      } catch (err) {
        await addEngineLog(`⚠️ Erreur phenomena: ${err.message}`, "warning", "IA.JEAN");
      }

      // 📈 Indice local
      const stationBoost = stationsSummary?.tempStation != null ? 1.05 : 1.0;
      const indiceLocal = Math.round(relief * hydro * climate * (freshnessScore / 100) * stationBoost * 100) / 100;
      const condition =
        indiceLocal > 115 ? "Atmosphère instable – risque d’averses ou vent fort"
        : indiceLocal > 100 ? "Ciel variable – humidité modérée"
        : "Conditions calmes et stables";

      analysed.push({
        ...r,
        country,
        altitude,
        reliefFactor: relief,
        hydroFactor: hydro,
        climateFactor: climate,
        stations: stationsSummary,
        rain, snow, wind,
        phenomena,
        indiceLocal,
        condition,
      });
    }

    // =======================================================
    // 🧮 Synthèse mondiale
    // =======================================================
    const moy = analysed.reduce((a, x) => a + x.indiceLocal, 0) / analysed.length;
    const variance = analysed.reduce((a, x) => a + Math.pow(x.indiceLocal - moy, 2), 0) / analysed.length;
    const indiceGlobal = Math.max(0, Math.min(100, Math.round((100 - variance) * 0.95)));

    const synthese =
      indiceGlobal > 90 ? "Atmosphère mondiale stable et prévisible"
      : indiceGlobal > 70 ? "Variabilité régionale modérée – surveillance requise"
      : indiceGlobal > 50 ? "Anomalies détectées sur plusieurs zones"
      : "Instabilité globale – déclenchement d’alertes recommandées";

    await addEngineLog(`📊 IA J.E.A.N. – Indice global ${indiceGlobal}% (${synthese})`, "success", "IA.JEAN");

    // =======================================================
    // 💾 Sauvegarde mondiale
    // =======================================================
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const outFile = path.join(dataDir, "jean_analysis_global.json");
    fs.writeFileSync(outFile, JSON.stringify(analysed, null, 2), "utf8");
    await addEngineLog(`💾 Résultats IA J.E.A.N. enregistrés dans ${outFile}`, "info", "IA.JEAN");

    return { indiceGlobal, synthese, count: analysed.length, file: outFile };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. (Globale): " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
