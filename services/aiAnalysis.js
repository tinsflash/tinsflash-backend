// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v5.5 REAL GLOBAL CONNECT – PHASE 2 FINALE)
// ==========================================================
// IA J.E.A.N. – Intelligence Atmosphérique interne
// Rôle : Expert météorologue, climatologue et mathématicien.
// Mission : produire des prévisions hyper-locales ultra précises,
// détecter les anomalies, anticiper les risques, et sauver des vies.
// ==========================================================

import fs from "fs";
import path from "path";
import {
  addEngineLog,
  addEngineError,
  getLastExtraction,
} from "./engineState.js";

import { fetchStationData } from "./stationsService.js"; // ✅ stations locales réelles
import { analyzeRain } from "./rainService.js"; // 🌧️ précipitations
import { analyzeSnow } from "./snowService.js"; // ❄️ neige
import { analyzeWind } from "./windService.js"; // 💨 vents
import { evaluatePhenomena } from "./phenomena/evaluate.js"; // ⚡ synthèse complémentaire IA (optionnelle)

// ==========================================================
// 🔬 FONCTIONS PHYSIQUES & ENVIRONNEMENTALES
// ==========================================================
function computeReliefFactor(lat, lon, altitude = 0) {
  const reliefImpact = Math.min(1.4, 1 + altitude / 2500);
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
    await addEngineLog(
      "🧠 Phase 2 – Démarrage IA J.E.A.N. interne",
      "info",
      "IA.JEAN"
    );

    await addEngineLog(
      "🌍 IA J.E.A.N. initialisée – mode Expert météorologue activé (mission humanitaire)",
      "info",
      "IA.JEAN"
    );

    const last = await getLastExtraction();
    if (!last || !last.files?.length) {
      await addEngineError("Aucune extraction trouvée pour analyse IA", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune extraction récente" };
    }

    const results = [];

    // ------------------------------------------------------
    // 📦 Lecture stricte des fichiers issus de la Phase 1
    // ------------------------------------------------------
    for (const filePath of last.files) {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          const raw = fs.readFileSync(fullPath, "utf8");
          if (!raw) continue;
          const content = JSON.parse(raw);
          const data = Array.isArray(content)
            ? content
            : content.phase1Results || [];
          results.push(...data);
          await addEngineLog(
            `📂 Données chargées depuis ${filePath} (${data.length} points)`,
            "info",
            "IA.JEAN"
          );
        } else {
          await addEngineError(`Fichier introuvable : ${fullPath}`, "IA.JEAN");
        }
      } catch (err) {
        await addEngineError(
          `Erreur lecture fichier : ${filePath} – ${err.message}`,
          "IA.JEAN"
        );
      }
    }

    if (!results.length) {
      await addEngineError("Aucune donnée valide trouvée", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Pas de données exploitables" };
    }

    // ------------------------------------------------------
    // 🔍 ANALYSE MÉTÉOROLOGIQUE COMPLÈTE
    // ------------------------------------------------------
    const analysed = [];
    for (const r of results) {
      const lat = Number(r.lat ?? r.latitude ?? 0);
      const lon = Number(r.lon ?? r.longitude ?? 0);
      const altitude = Number(r.altitude ?? 150);
      const freshnessScore = Number(r.freshnessScore ?? 100);

      const relief = computeReliefFactor(lat, lon, altitude);
      const hydro = computeHydroFactor(lat, lon);
      const climate = computeClimateFactor(lat);

      // --------------------------------------------------
      // 🌡️ STATIONS LOCALES
      // --------------------------------------------------
      let stationsSummary = null;
      try {
        const stationRes = await fetchStationData(
          lat,
          lon,
          r.country || "Unknown",
          r.region || ""
        );
        if (stationRes?.data) {
          const temps = [];
          const hums = [];
          const winds = [];
          const press = [];
          const pushIf = (val, arr) =>
            typeof val === "number" && !isNaN(val) && arr.push(val);

          const entries = Array.isArray(stationRes.data)
            ? stationRes.data
            : [stationRes.data];
          for (const e of entries) {
            if (!e) continue;
            pushIf(e.temperature_2m, temps);
            pushIf(e.temp, temps);
            pushIf(e.temperature, temps);
            pushIf(e.relative_humidity_2m, hums);
            pushIf(e.humidity, hums);
            pushIf(e.wind_speed_10m, winds);
            pushIf(e.wind_speed, winds);
            pushIf(e.pressure_msl, press);
            pushIf(e.pressure, press);
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
        await addEngineLog(
          `⚠️ Station locale (${lat},${lon}) : ${err.message}`,
          "warning",
          "IA.JEAN"
        );
      }

      // --------------------------------------------------
      // ⚡ PHÉNOMÈNES RÉELS (pluie, neige, vent, etc.)
      // --------------------------------------------------
      let rain = null,
        snow = null,
        wind = null;
      try {
        rain = await analyzeRain(lat, lon, r.country || "", r.region || "");
        snow = await analyzeSnow(lat, lon, r.country || "", r.region || "");
        wind = await analyzeWind(lat, lon, r.country || "", r.region || "");
      } catch (err) {
        await addEngineLog(
          `⚠️ Erreur phénomènes météo : ${err.message}`,
          "warning",
          "IA.JEAN"
        );
      }

      // --------------------------------------------------
      // ⚡ SYNTHÈSE IA PHÉNOMÈNES (évaluation globale)
      // --------------------------------------------------
      let phenomena = null;
      try {
        if (typeof evaluatePhenomena === "function") {
          phenomena = evaluatePhenomena({
            lat,
            lon,
            altitude,
            base: r,
            stations: stationsSummary,
            sub: { rain, snow, wind },
            factors: { relief, hydro, climate, freshnessScore },
          });
        }
      } catch (err) {
        await addEngineLog(
          `⚠️ Erreur evaluatePhenomena : ${err.message}`,
          "warning",
          "IA.JEAN"
        );
      }

      // --------------------------------------------------
      // 📈 SCORE LOCAL
      // --------------------------------------------------
      const stationBoost = stationsSummary?.tempStation != null ? 1.05 : 1.0;
      const weatherPenalty =
        (rain?.risk === "high" ? 0.93 : 1) *
        (snow?.risk === "high" ? 0.95 : 1) *
        (wind?.risk === "high" ? 0.92 : 1);
      const indiceLocal =
        Math.round(
          (relief * hydro * climate * (freshnessScore / 100) * stationBoost * weatherPenalty) * 100
        ) / 100;

      const condition =
        indiceLocal > 115
          ? "Atmosphère instable – risque d’averses ou vents forts"
          : indiceLocal > 100
          ? "Ciel variable – humidité modérée"
          : "Conditions calmes et stables";

      analysed.push({
        ...r,
        altitude,
        reliefFactor: relief,
        hydroFactor: hydro,
        climateFactor: climate,
        stations: stationsSummary,
        rain,
        snow,
        wind,
        phenomena,
        indiceLocal,
        condition,
      });
    }

    // ------------------------------------------------------
    // 🧮 SYNTHÈSE GLOBALE
    // ------------------------------------------------------
    const moy = analysed.reduce((acc, x) => acc + x.indiceLocal, 0) / analysed.length;
    const variance =
      analysed.reduce((acc, x) => acc + Math.pow(x.indiceLocal - moy, 2), 0) /
      analysed.length;
    const indiceGlobal = Math.max(
      0,
      Math.min(100, Math.round((100 - variance) * 0.95))
    );

    const synthese =
      indiceGlobal > 90
        ? "Atmosphère stable et prévisible – aucun risque immédiat"
        : indiceGlobal > 70
        ? "Variabilité régionale modérée – surveillance recommandée"
        : indiceGlobal > 50
        ? "Anomalies détectées – observation active nécessaire"
        : "Instabilité forte – déclenchement d’alerte probable";

    await addEngineLog(
      `📊 IA J.E.A.N. – Indice global ${indiceGlobal}% (${synthese})`,
      "success",
      "IA.JEAN"
    );

    // ------------------------------------------------------
    // 💾 SAUVEGARDE
    // ------------------------------------------------------
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "jean_analysis.json");
    fs.writeFileSync(filePath, JSON.stringify(analysed, null, 2), "utf8");

    await addEngineLog(
      `💾 Résultats IA J.E.A.N. enregistrés dans ${filePath}`,
      "info",
      "IA.JEAN"
    );

    return { indiceGlobal, synthese, count: analysed.length, file: filePath };
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    return { error: e.message };
  }
}

// ----------------------------------------------------------
// 📤 EXPORT
// ----------------------------------------------------------
export default { runAIAnalysis };
