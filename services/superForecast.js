// ==========================================================
// 🌍 TINSFLASH – superForecast.js (Everest Protocol v3.9 PRO+++)
// ==========================================================
// ✅ PHASE 1 – Extraction pure et réelle des modèles météorologiques
// ✅ PHASE 2 – Analyse IA J.E.A.N. (fusion, pondération, IA explicative)
// ✅ PHASE 3 – Génération et fusion d’alertes mondiales/locales
// Relié à runGlobal.js, aiAnalysis.js et runWorldAlerts.js
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { autoCompareAfterRun } from "./compareExternalIA.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { runAIAnalysis } from "./aiAnalysis.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

// ==========================================================
// 🔧 Fusion multi-modèles (OpenData + IA externes)
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);
  const logModel = (emoji, name, temp, precip, wind, ok = true) => {
    const color = ok ? "\x1b[32m" : "\x1b[31m";
    console.log(`${color}${emoji} [${name}] → T:${temp ?? "?"}°C | P:${precip ?? "?"}mm | V:${wind ?? "?"} km/h ${ok ? "✅" : "⚠️"}\x1b[0m`);
  };

  try {
    const openModels = [
      { name: "GFS NOAA", url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "ICON DWD", url: `https://api.open-meteo.com/v1/icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "ECMWF ERA5", url: `https://api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "AROME", url: `https://api.open-meteo.com/v1/arome?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "HRRR", url: `https://api.open-meteo.com/v1/hrrr?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m` },
      { name: "NASA POWER", url: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS10M&longitude=${lon}&latitude=${lat}&format=JSON` },
      { name: "WeatherGov", url: `https://api.weather.gov/points/${lat},${lon}` },
    ];

    for (const m of openModels) {
      try {
        const res = await axios.get(m.url, { timeout: 10000 });
        const d = res.data?.current || res.data?.properties?.parameter || res.data?.properties || {};
        const model = {
          source: m.name,
          temperature: d.temperature_2m ?? d.T2M ?? null,
          precipitation: d.precipitation ?? d.PRECTOTCORR ?? 0,
          wind: d.wind_speed_10m ?? d.WS10M ?? null,
        };
        push(model);
        logModel("🌐", m.name, model.temperature, model.precipitation, model.wind, true);
      } catch (e) {
        logModel("🌐", m.name, null, null, null, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    const iaModels = [
      { name: "GraphCast", url: `${process.env.GRAPHCAST_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "Pangu", url: `${process.env.PANGU_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "CorrDiff", url: `${process.env.CORRDIFF_API || ""}/forecast?lat=${lat}&lon=${lon}` },
      { name: "AIFS", url: `https://api.ecmwf.int/v1/aifs?lat=${lat}&lon=${lon}&format=json` },
      { name: "NowcastNet", url: `${process.env.NOWCASTNET_API || ""}/forecast?lat=${lat}&lon=${lon}` },
    ];

    for (const m of iaModels) {
      try {
        if (!m.url || m.url.includes("undefined")) continue;
        const res = await axios.get(m.url, { timeout: 8000 });
        const d = res.data || {};
        const model = {
          source: m.name,
          temperature: d.temperature ?? d.temperature_2m ?? null,
          precipitation: d.precipitation ?? d.total_precipitation ?? 0,
          wind: d.wind ?? d.wind_10m ?? null,
        };
        push(model);
        logModel("🤖", m.name, model.temperature, model.precipitation, model.wind, true);
      } catch (e) {
        logModel("🤖", m.name, null, null, null, false);
        await addEngineError(`${m.name} (IA externe) indisponible : ${e.message}`, "superForecast");
      }
    }

    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const valid = sources.filter((s) => s.temperature !== null && s.wind !== null);
    const reliability = +(valid.length / (sources.length || 1)).toFixed(2);
    let result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      sources: valid.map((s) => s.source),
    };

    result = await applyGeoFactors(result, lat, lon, country);
    result = await applyLocalFactors(result, lat, lon, country);

    await addEngineLog(
      `📡 ${valid.length}/${sources.length} modèles actifs (${Math.round(reliability * 100)}%) – ${country}`,
      "info",
      "superForecast"
    );

    return result;
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

// ==========================================================
// 🧠 PHASE 2 – Analyse IA J.E.A.N.
// ==========================================================
async function runAIJeanFusion(results) {
  try {
    await addEngineLog("🧠 Analyse IA J.E.A.N. – démarrage", "info", "superForecast");
    const ai = await runAIAnalysis(results);
    await addEngineLog(`🧠 Analyse IA J.E.A.N. terminée – Indice Global ${ai.indiceGlobal || 0}%`, "success", "superForecast");
    return ai;
  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "superForecast");
    return { error: e.message };
  }
}

// ==========================================================
// 📢 PHASE 3 – Fusion & génération d’alertes mondiales
// ==========================================================
async function runGlobalAlertsFusion() {
  try {
    const result = await runWorldAlerts();
    await addEngineLog("📢 Fusion des alertes terminée", "success", "superForecast");
    return result;
  } catch (e) {
    await addEngineError("Erreur fusion alertes : " + e.message, "superForecast");
    return { error: e.message };
  }
}

// ==========================================================
// 🚀 Fonction principale – SuperForecast (multi-phase complet)
// ==========================================================
export async function superForecast({ zones = [], runType = "global" }) {
  try {
    console.log(`\n🛰️ SuperForecast complet lancé (${zones.length} zones)`);
    await addEngineLog(`🛰️ SuperForecast complet (${zones.length} zones)`, "info", "core");

    const phase1Results = [];
    for (const z of zones) {
      const { lat, lon, country } = z;
      const merged = await mergeMultiModels(lat, lon, country);
      phase1Results.push({ zone: z.zone || country, lat, lon, country, ...merged, timestamp: new Date() });
    }
    await addEngineLog("✅ Phase 1 – Extraction pure terminée", "success", "core");

    const aiResults = await runAIJeanFusion(phase1Results);
    await addEngineLog("✅ Phase 2 – IA J.E.A.N. terminée", "success", "core");

    const alerts = await runGlobalAlertsFusion();
    await addEngineLog("✅ Phase 3 – Fusion alertes terminée", "success", "core");

    try {
      await autoCompareAfterRun(phase1Results);
    } catch (e) {
      await addEngineError("Audit externe échoué : " + e.message, "superForecast");
    }

    await addEngineLog("✅ SuperForecast complet terminé", "success", "core");
    return { success: true, phase1Results, aiResults, alerts };
  } catch (err) {
    await addEngineError("Erreur SuperForecast global : " + err.message, "superForecast");
    return { error: err.message };
  }
}

export default { superForecast };
