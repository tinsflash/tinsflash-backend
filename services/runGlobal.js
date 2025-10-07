// PATH: services/runGlobal.js
// 🌍 TINSFLASH – RUN GLOBAL (Phase 1 : Extraction réelle optimisée)
// Objectif : pomper toutes les sources météo, générer alertes physiques,
// fusionner continentales et mondiales, préparer rapport intermédiaire IA J.E.A.N.

import mongoose from "mongoose";
import fetch from "node-fetch";
import pLimit from "p-limit";
import { enumerateCoveredPoints } from "./zonesCovered.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";
import { generateAlerts, getActiveAlerts } from "./alertsService.js";
import { getEngineState, saveEngineState } from "./engineState.js";
import * as adminLogs from "./adminLogs.js";
import weatherGovService from "./weatherGovService.js";
import euroMeteoService from "./euroMeteoService.js";

const TIMEOUT = 7000; // 7 s max / API
const limit = pLimit(5); // 5 requêtes simultanées max

async function safeFetch(url, label) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    throw new Error(`${label} – ${e.message}`);
  }
}

/* ======================================================
   🚀 RUN GLOBAL – Extraction réelle + Logs temps réel
====================================================== */
export async function runGlobal(zone = "All") {
  const state = await getEngineState();
  await adminLogs.startNewCycle();
  await adminLogs.addLog(`🌍 RUN GLOBAL – Phase 1 (Extraction réelle) zone=${zone}`);

  try {
    // 🔎 Pré-check Mongo / accès
    if (mongoose.connection.readyState !== 1)
      throw new Error("MongoDB non connecté");

    // 🌐 Définition modèles
    const MODELS = [
      { id: "GFS", model: "gfs_seamless" },
      { id: "ECMWF", model: "ecmwf_ifs04" },
      { id: "ICON", model: "icon_global" },
      { id: "HRRR", model: "hrrr" },
      { id: "UKMO", model: "ukmo_global" },
      { id: "NASA_POWER", model: "nasa" },
      { id: "OPENWEATHER", model: "openweather" },
    ];

    const modelStats = {};
    for (const m of MODELS) modelStats[m.id] = { ok: 0, fail: 0, errors: [] };

    const points = enumerateCoveredPoints();
    const total = points.length;
    let done = 0;

    // 🌍 Extraction réelle parallèle (limitée)
    await Promise.all(points.map(p =>
      limit(async () => {
        try {
          const res = await Promise.allSettled(MODELS.map(async (m) => {
            let data;
            if (m.id === "NASA_POWER")
              data = await safeFetch(`https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M&community=RE&latitude=${p.lat}&longitude=${p.lon}&format=JSON`, "NASA");
            else if (m.id === "OPENWEATHER")
              data = await safeFetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${p.lat}&lon=${p.lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`, "OpenWeather");
            else
              data = await safeFetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&models=${m.model}&hourly=temperature_2m`, m.id);
            modelStats[m.id].ok++;
            return data;
          }));
          done++;
          if (done % 50 === 0) await adminLogs.addLog(`⏱ ${done}/${total} points traités`);
          return res;
        } catch (e) {
          modelStats.GFS.fail++;
          modelStats.GFS.errors.push(`${p.country}/${p.region}: ${e.message}`);
        }
      })
    ));

    await adminLogs.addLog("✅ Extraction brute terminée");

    // ⚠️ Alertes locales
    await adminLogs.addLog("🚨 Génération alertes locales/nationales…");
    for (const p of points) await generateAlerts(p.lat, p.lon, p.country, p.region, p.continent);
    const alertsLocal = await getActiveAlerts();
    await adminLogs.addLog(`✅ ${alertsLocal.length} alertes locales actives`);

    // 🌐 Alertes continentales
    const continental = await runContinental().catch(e => {
      adminLogs.addError("runContinental : " + e.message);
      return { alerts: [] };
    });

    // 🌎 Fusion mondiale brute
    const world = await runWorldAlerts().catch(e => {
      adminLogs.addError("runWorldAlerts : " + e.message);
      return [];
    });

    // 🔍 Vérifications officielles
    try {
      if (zone === "USA" || zone === "All")
        state.checkup.nwsComparison = await weatherGovService.crossCheck({}, alertsLocal);
      if (zone === "Europe" || zone === "All")
        state.checkup.euComparison = await euroMeteoService.crossCheck({}, alertsLocal);
      await adminLogs.addLog("✅ Cross-check NWS/MeteoAlarm OK");
    } catch (e) {
      await adminLogs.addError("⚠️ Cross-check : " + e.message);
    }

    // 🧾 Rapport intermédiaire
    const partialReport = {
      generatedAt: new Date().toISOString(),
      totalPoints: total,
      models: Object.fromEntries(Object.entries(modelStats).map(([k, v]) =>
        [k, { ok: v.ok, fail: v.fail, errors: v.errors.slice(0, 10) }]
      )),
      alerts: {
        local: alertsLocal.length,
        continental: continental.alerts?.length || 0,
        world: world.length,
      },
    };

    // 💾 Sauvegarde moteur
    state.status = "extracted";
    state.lastRun = new Date();
    state.checkup.engineStatus = "OK-EXTRACTED";
    state.partialReport = partialReport;
    state.alertsLocal = alertsLocal;
    state.alertsContinental = continental.alerts;
    state.alertsWorld = world;
    await saveEngineState(state);

    await adminLogs.addLog("✅ Étape 1 terminée (Extraction SANS IA)");
    return { success: true, partialReport };
  } catch (err) {
    await adminLogs.addError("❌ RUN GLOBAL FAIL : " + err.message);
    state.status = "fail";
    state.checkup.engineStatus = "FAIL";
    await saveEngineState(state);
    return { success: false, error: err.message };
  }
}
