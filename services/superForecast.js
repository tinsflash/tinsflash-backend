// ==========================================================
// 🌍 TINSFLASH – superForecast.js (Everest Protocol v5.1.1 PRO+++)
// ==========================================================
// 🔸 Phase 1 : Extraction pure (physique, sans IA)
// 🔸 Phase 2 : IA J.E.A.N. optionnelle (fusion, pondération, alertes)
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { applyGeoFactors } from "./geoFactors.js";
import { applyLocalFactors } from "./localFactors.js";
import { runAIAnalysis } from "./aiAnalysis.js";
import { runWorldAlerts } from "./runWorldAlerts.js";
import { autoCompareAfterRun } from "./compareExternalIA.js";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ==========================================================
// 🔧 FUSION MULTI-MODÈLES PHYSIQUES
// ==========================================================
async function mergeMultiModels(lat, lon, country = "EU") {
  const sources = [];
  const push = (s) => s && !s.error && sources.push(s);
  const log = (name, ok) => console.log(`${ok ? "✅" : "⚠️"} ${name}`);

  try {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");

    // Liste des modèles physiques réels utilisés
    const models = [
      {
        name: "GFS NOAA",
        url: `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "ECMWF ERA5",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${ymd}&end=${ymd}&format=JSON`,
      },
      {
        name: "AROME MeteoFrance",
        url: `https://api.open-meteo.com/v1/meteofrance?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "ICON DWD",
        url: `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`,
      },
      {
        name: "NASA POWER",
        url: `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOTCORR,WS10M&community=RE&longitude=${lon}&latitude=${lat}&start=${ymd}&end=${ymd}&format=JSON`,
      },
    ];

    // Exécution séquentielle avec tolérance d’erreur
    for (const m of models) {
      try {
        const r = await axios.get(m.url, { timeout: 15000 });
        const d = r.data?.current || r.data?.parameters || {};
        const T = d.temperature_2m ?? d.T2M ?? null;
        const P = d.precipitation ?? d.PRECTOTCORR ?? 0;
        const W = d.wind_speed_10m ?? d.WS10M ?? null;
        push({ source: m.name, temperature: T, precipitation: P, wind: W });
        log(m.name, true);
      } catch (e) {
        log(m.name, false);
        await addEngineError(`${m.name} indisponible : ${e.message}`, "superForecast");
      }
    }

    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const valid = sources.filter((s) => s.temperature !== null);
    const reliability = +(valid.length / (models.length || 1)).toFixed(2);

    const result = {
      temperature: avg(valid.map((s) => s.temperature)),
      precipitation: avg(valid.map((s) => s.precipitation)),
      wind: avg(valid.map((s) => s.wind)),
      reliability,
      sources: valid.map((s) => s.source),
    };

    return await applyLocalFactors(
      await applyGeoFactors(result, lat, lon, country),
      lat,
      lon,
      country
    );
  } catch (err) {
    await addEngineError(`mergeMultiModels : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

// ==========================================================
// 🚀 SUPERFORECAST PRINCIPAL (extraction pure + IA optionnelle)
// ==========================================================
export async function superForecast({ zones = [], runType = "global", withAI = false }) {
  try {
    console.log(`🛰️ SuperForecast lancé (${zones.length} zones – ${runType})`);
    await addEngineLog(`🛰️ SuperForecast ${runType} (${zones.length} zones)`, "info", "superForecast");

    // --- PHASE 1 : Extraction pure ---
    const phase1Results = [];
    let counter = 0;
    for (const z of zones) {
      counter++;
      const { lat, lon, country, region } = z;
      const merged = await mergeMultiModels(lat, lon, country);
      phase1Results.push({
        zone: region || country,
        lat,
        lon,
        country,
        ...merged,
        timestamp: new Date(),
      });
      if (counter % 5 === 0) await delay(300); // respiration anti-Render crash
    }
    await addEngineLog(`✅ Phase 1 terminée (${runType})`, "success", "superForecast");

    // --- PHASE 2 : IA (optionnelle) ---
    if (withAI) {
      const aiResults = await runAIAnalysis(phase1Results);
      const alerts = await runWorldAlerts();
      await autoCompareAfterRun(phase1Results);
      await addEngineLog(`🤖 IA J.E.A.N. & alertes terminées (${runType})`, "success", "superForecast");
      return { success: true, phase1Results, aiResults, alerts };
    }

    return { success: true, phase1Results };
  } catch (err) {
    await addEngineError(`Erreur SuperForecast : ${err.message}`, "superForecast");
    return { error: err.message };
  }
}

export default { superForecast };
