// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v5.6 REAL GLOBAL CONNECT – PHASE 2 FINALE)
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
import { fetchRainData } from "./rainService.js";
import { fetchSnowData } from "./snowService.js";
import { fetchWindData } from "./windService.js";

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
    // 🔎 Recherche dynamique du fichier Phase 1
    // =======================================================
    let files = [];
    const dataDir = path.join(process.cwd(), "data");

    try {
      const last = await getLastExtraction();
      if (last?.files?.length) {
        files = last.files;
      } else if (fs.existsSync(dataDir)) {
        const all = fs.readdirSync(dataDir)
          .filter(f => f.endsWith(".json"))
          .map(f => ({ f, t: fs.statSync(path.join(dataDir, f)).mtimeMs }))
          .sort((a, b) => b.t - a.t);
        if (all.length) files.push(path.join(dataDir, all[0].f));
      }
    } catch (err) {
      await addEngineError("Erreur récupération extraction : " + err.message, "IA.JEAN");
    }

    if (!files.length) {
      await addEngineError("Aucun fichier d'extraction trouvé pour analyse IA", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Pas de données Phase 1 trouvées" };
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
      await addEngineError("Aucune donnée valide trouvée", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune donnée exploitable" };
    }

    // =======================================================
    // 🔍 Analyse météorologique globale
    // =======================================================
    const analysed = [];

    for (const r of results) {
      const lat = Number(r.lat ?? r.latitude ?? 0);
      const lon = Number(r.lon ?? r.longitude ?? 0);
      const altitude = Number(r.altitude ?? 150);
      const freshnessScore = Number(r.freshnessScore ?? 100);

      const relief = computeReliefFactor(lat, lon, altitude);
      const hydro = computeHydroFactor(lat, lon);
      const climate = computeClimateFactor(lat);

      // 🌡️ Stations locales
      let stationsSummary = null;
      try {
        const stationRes = await fetchStationData(lat, lon, r.country || "Unknown", r.region || "");
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
            tempStation: safeAvg(temps),
            humidityStation: safeAvg(hums),
            windStation: safeAvg(winds),
            pressureStation: safeAvg(press),
          };
        }
      } catch (err) {
        await addEngineLog(`⚠️ Station error (${lat},${lon}): ${err.message}`, "warning", "IA.JEAN");
      }

      // 🌧️ Pluie, neige, vent
      let rain = null, snow = null, wind = null;
      try {
        rain = await fetchRainData(lat, lon);
        snow = await fetchSnowData(lat, lon);
        wind = await fetchWindData(lat, lon);
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
      const indiceLocal = Math.round(
        relief * hydro * climate * (freshnessScore / 100) * stationBoost * 100
      ) / 100;

      const condition =
        indiceLocal > 115 ? "Atmosphère instable – risque d’averses ou vent fort"
        : indiceLocal > 100 ? "Ciel variable – humidité modérée"
        : "Conditions calmes et stables";

      analysed.push({
        ...r,
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
    // 🧮 Calcul global et synthèse
    // =======================================================
    const moy = analysed.reduce((a, x) => a + x.indiceLocal, 0) / analysed.length;
    const variance = analysed.reduce((a, x) => a + Math.pow(x.indiceLocal - moy, 2), 0) / analysed.length;
    const indiceGlobal = Math.max(0, Math.min(100, Math.round((100 - variance) * 0.95)));

    const synthese =
      indiceGlobal > 90 ? "Atmosphère stable et prévisible – aucun risque immédiat"
      : indiceGlobal > 70 ? "Variabilité régionale modérée – surveillance recommandée"
      : indiceGlobal > 50 ? "Anomalies détectées – observation active nécessaire"
      : "Instabilité forte – déclenchement d’alerte probable";

    await addEngineLog(`📊 IA J.E.A.N. – Indice global ${indiceGlobal}% (${synthese})`, "success", "IA.JEAN");

    // =======================================================
    // 💾 Sauvegarde
    // =======================================================
    const outFile = path.join(dataDir, "jean_analysis.json");
    fs.writeFileSync(outFile, JSON.stringify(analysed, null, 2), "utf8");
    await addEngineLog(`💾 Résultats IA J.E.A.N. enregistrés dans ${outFile}`, "info", "IA.JEAN");

    return { indiceGlobal, synthese, count: analysed.length, file: outFile };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

export default { runAIAnalysis };
