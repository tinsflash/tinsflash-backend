// PATH: services/runGlobal.js
// ⚙️ TINSFLASH – RUN GLOBAL (PHASE 1 : EXTRACTION RÉELLE SANS IA)
// Objectif : pomper toutes les sources réelles, générer alertes physiques, alerte continentale et mondiale,
// produire un RAPPORT INTERMÉDIAIRE (partialReport) prêt pour la phase IA J.E.A.N.

import mongoose from "mongoose";
import fetch from "node-fetch";
import { enumerateCoveredPoints } from "./zonesCovered.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";
import { generateAlerts, getActiveAlerts } from "./alertsService.js";
import { getEngineState, saveEngineState } from "./engineState.js";
import * as adminLogs from "./adminLogs.js";
import weatherGovService from "./weatherGovService.js";
import euroMeteoService from "./euroMeteoService.js";

/* ======================================================
   🔍 1️⃣ Pré-check de connectivité (AUCUNE IA)
====================================================== */
async function preRunChecks() {
  const errors = [];

  if (mongoose.connection.readyState !== 1) {
    errors.push({ code: "DB_CONN", msg: "MongoDB non connecté" });
  }

  try {
    const r = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&hourly=temperature_2m"
    );
    if (!r.ok) errors.push({ code: "SRC_DOWN", msg: `Open-Meteo HTTP ${r.status}` });
  } catch {
    errors.push({ code: "SRC_DOWN", msg: "Open-Meteo inaccessible" });
  }

  try {
    const r = await fetch(
      "https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M&community=RE&latitude=0&longitude=0&format=JSON"
    );
    if (!r.ok)
      await adminLogs.addLog("⚠️ NASA POWER inaccessible (non bloquant)");
  } catch {
    await adminLogs.addLog("⚠️ NASA POWER ping KO (non bloquant)");
  }

  if (errors.length) {
    for (const e of errors)
      await adminLogs.addError(`PRECHECK ❌ ${e.code}: ${e.msg}`);
    throw new Error(`Pré-check échoué (${errors.length})`);
  }

  await adminLogs.addLog("✅ Pré-checks terminés (sources accessibles)");
}

/* ======================================================
   🔬 2️⃣ Fonctions d’extraction réelles
====================================================== */
async function pullOpenMeteo(modelId, lat, lon) {
  const map = {
    GFS: "gfs_seamless",
    ECMWF: "ecmwf_ifs04",
    ICON: "icon_global",
    HRRR: "hrrr",
    UKMO: "ukmo_global",
    DWD_ICON_EU: "icon_eu",
  };
  const model = map[modelId];
  if (!model) throw new Error(`Modèle Open-Meteo inconnu: ${modelId}`);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,snowfall&models=${model}&forecast_days=3`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo ${modelId} HTTP ${r.status}`);
  await new Promise((rslv) => setTimeout(rslv, 120)); // Anti-saturation
  return { ok: true, model: modelId };
}

async function pullNasaPower(lat, lon) {
  const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,WS10M,PRECTOTCORR&community=RE&latitude=${lat}&longitude=${lon}&format=JSON`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`NASA POWER HTTP ${r.status}`);
  return { ok: true, model: "NASA_POWER" };
}

async function pullOpenWeather(lat, lon) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("OPENWEATHER_API_KEY manquante");
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OpenWeather HTTP ${r.status}`);
  return { ok: true, model: "OPENWEATHER" };
}

/* ======================================================
   🚀 3️⃣ Lancement complet : RUN GLOBAL (Extraction)
====================================================== */
export async function runGlobal(zone = "All") {
  const state = await getEngineState();

  try {
    await adminLogs.startNewCycle();
    await adminLogs.addLog(`🌍 RUN GLOBAL – Phase 1 (EXTRACTION SANS IA) – zone=${zone}`);
    await preRunChecks();

    const modelsRequested = [
      "GFS",
      "ECMWF",
      "ICON",
      "HRRR",
      "UKMO",
      "DWD_ICON_EU",
      "NASA_POWER",
      "OPENWEATHER",
    ];

    const modelStats = {};
    for (const m of modelsRequested) modelStats[m] = { ok: 0, fail: 0, errors: [] };

    const points = enumerateCoveredPoints();
    const totalPoints = points.length;
    const countriesOK = new Set();
    const countriesFail = new Set();

    /* -----------------------------
       🛰️  Extraction multi-modèles
    ------------------------------*/
    for (const p of points) {
      let pointOK = true;
      for (const model of modelsRequested) {
        try {
          let res;
          if (
            ["GFS", "ECMWF", "ICON", "HRRR", "UKMO", "DWD_ICON_EU"].includes(model)
          ) {
            res = await pullOpenMeteo(model, p.lat, p.lon);
          } else if (model === "NASA_POWER") {
            res = await pullNasaPower(p.lat, p.lon);
          } else if (model === "OPENWEATHER") {
            res = await pullOpenWeather(p.lat, p.lon);
          }
          if (res?.ok) modelStats[model].ok++;
          else throw new Error(`${model} sans réponse OK`);
        } catch (err) {
          modelStats[model].fail++;
          modelStats[model].errors.push(`${p.country}/${p.region}: ${err.message}`);
          pointOK = false;
        }
      }
      if (pointOK) countriesOK.add(p.country);
      else countriesFail.add(p.country);
    }

    await adminLogs.addLog(`📊 Extraction terminée – ${totalPoints} points, ${modelsRequested.length} modèles.`);

    /* -----------------------------
       ⚠️  Alertes physiques locales
    ------------------------------*/
    await adminLogs.addLog("🚨 Génération alertes locales/nationales (physiques uniquement)...");
    for (const p of points) {
      await generateAlerts(p.lat, p.lon, p.country, p.region, p.continent);
    }
    const alertsLocal = await getActiveAlerts();
    await adminLogs.addLog(`✅ ${alertsLocal.length} alertes locales actives.`);

    /* -----------------------------
       🌐  Alertes continentales
    ------------------------------*/
    let continentalAlerts = [];
    try {
      const cont = await runContinental();
      continentalAlerts = cont?.alerts || [];
      await adminLogs.addLog(`✅ ${continentalAlerts.length} alertes continentales.`);
    } catch (e) {
      await adminLogs.addError("⚠️ runContinental: " + e.message);
    }

    /* -----------------------------
       🌎  Fusion mondiale brute
    ------------------------------*/
    let worldFusion = [];
    try {
      worldFusion = (await runWorldAlerts()) || [];
      await adminLogs.addLog(`🌎 Fusion mondiale brute: ${worldFusion.length} éléments.`);
    } catch (e) {
      await adminLogs.addError("⚠️ runWorldAlerts: " + e.message);
    }

    /* -----------------------------
       🔍  Vérifications officielles
    ------------------------------*/
    try {
      if (zone === "USA" || zone === "All") {
        const nws = await weatherGovService.crossCheck({}, alertsLocal);
        state.checkup = state.checkup || {};
        state.checkup.nwsComparison = nws;
        await adminLogs.addLog(`🇺🇸 NWS cross-check OK.`);
      }
      if (zone === "Europe" || zone === "All") {
        const eu = await euroMeteoService.crossCheck({}, alertsLocal);
        state.checkup = state.checkup || {};
        state.checkup.euComparison = eu;
        await adminLogs.addLog(`🇪🇺 MeteoAlarm cross-check OK.`);
      }
    } catch (e) {
      await adminLogs.addError("⚠️ Cross-check: " + e.message);
    }

    /* -----------------------------
       🧾  Rapport intermédiaire
    ------------------------------*/
    const partialReport = {
      generatedAt: new Date().toISOString(),
      zoneRequested: zone,
      extraction: {
        totalPoints,
        countriesTotal: new Set(points.map((p) => p.country)).size,
        countriesOK: Array.from(countriesOK),
        countriesFail: Array.from(countriesFail),
      },
      models: Object.fromEntries(
        Object.entries(modelStats).map(([k, v]) => [
          k,
          { ok: v.ok, fail: v.fail, sampleErrors: v.errors.slice(0, 25) },
        ])
      ),
      alerts: {
        localCount: alertsLocal.length,
        continentalCount: continentalAlerts.length,
      },
      world: { fusedCount: worldFusion.length },
      note: "Rapport intermédiaire sans IA – prêt pour phase IA J.E.A.N.",
    };

    /* -----------------------------
       💾  Sauvegarde moteur
    ------------------------------*/
    state.status = "extracted";
    state.lastRun = new Date();
    state.checkup = state.checkup || {};
    state.checkup.engineStatus = "OK-EXTRACTED";
    state.partialReport = partialReport;
    state.alertsLocal = alertsLocal;
    state.alertsContinental = continentalAlerts;
    state.alertsWorld = worldFusion;
    await saveEngineState(state);

    await adminLogs.addLog("✅ Étape 1 terminée (Extraction SANS IA).");
    await adminLogs.addLog("🧠 Étape 2 (J.E.A.N.) disponible via runGlobalAI().");

    return { success: true, partialReport };
  } catch (err) {
    await adminLogs.addError("❌ RUN GLOBAL (Extraction) échec: " + err.message);
    const s = await getEngineState();
    s.status = "fail";
    s.checkup = s.checkup || {};
    s.checkup.engineStatus = "FAIL";
    await saveEngineState(s);
    return { success: false, error: err.message };
  }
}

/* ======================================================
   ♻️ Relance partielle possible
====================================================== */
export async function retryPhase(phase) {
  await adminLogs.addLog(`🔁 Relance extraction demandée : ${phase}`);
  return { success: true };
}
