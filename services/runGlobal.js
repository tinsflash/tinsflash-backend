// PATH: services/runGlobal.js
// ⚙️ TINSFLASH – RUN GLOBAL (ÉTAPE 1: EXTRACTION SANS IA)
// -> pompe les modèles réels, génère alertes physiques, alerte continentale (fallback),
// -> produit un RAPPORT INTERMÉDIAIRE (partialReport) et diffuse tout en SSE logs.

import mongoose from "mongoose";
import fetch from "node-fetch";
import { enumerateCoveredPoints } from "./zonesCovered.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";
import { generateAlerts, getActiveAlerts } from "./alertsService.js"; // SANS IA à l’intérieur
import {
  getEngineState,
  saveEngineState,
} from "./engineState.js";
import * as adminLogs from "./adminLogs.js"; // 🔴 Diffusion SSE en direct (pas de modif du fichier)
import weatherGovService from "./weatherGovService.js";
import euroMeteoService from "./euroMeteoService.js";

/* ---------------------------------------------
   🧩 Pré-check – SANS IA (pas d'OPENAI requis ici)
----------------------------------------------*/
async function preRunChecks() {
  const errors = [];

  if (mongoose.connection.readyState !== 1) {
    errors.push({ code: "DB_CONN", msg: "MongoDB non connecté" });
  }

  // Vérif connectivité Open-Meteo (multi-modèles réels)
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&hourly=temperature_2m");
    if (!r.ok) errors.push({ code: "SRC_DOWN", msg: `Open-Meteo HTTP ${r.status}` });
  } catch {
    errors.push({ code: "SRC_DOWN", msg: "Open-Meteo inaccessible" });
  }

  // NASA POWER (rayonnement, humidité, etc.)
  try {
    const r = await fetch("https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M&community=RE&latitude=0&longitude=0&format=JSON");
    if (!r.ok) await adminLogs.addLog("⚠️ NASA POWER non essentiel indisponible (test).");
  } catch {
    await adminLogs.addLog("⚠️ NASA POWER ping KO (non bloquant).");
  }

  if (errors.length) {
    for (const e of errors) await adminLogs.addError(`PRECHECK ❌ ${e.code}: ${e.msg}`);
    throw new Error(`Pré-check échoué (${errors.length})`);
  }
  await adminLogs.addLog("✅ Pré-checks terminés (sans IA)");
}

/* ---------------------------------------------
   🔌 Collecte modèle par point (réel)
   - Open-Meteo: GFS/ECMWF/ICON/HRRR/UKMO/DWD...
   - NASA POWER
   - OpenWeather (si clé présente)
----------------------------------------------*/
async function pullOpenMeteo(modelId, lat, lon) {
  // mapping Open-Meteo 'models' param (doc officielle)
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
  const json = await r.json();
  return {
    ok: true,
    model: modelId,
    meta: { elevation: json.elevation, timezone: json.timezone },
  };
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

/* ---------------------------------------------
   🚀 RUN GLOBAL – ÉTAPE 1 (EXTRACTION SEULE)
----------------------------------------------*/
export async function runGlobal(zone = "All") {
  const state = await getEngineState();
  try {
    await adminLogs.startNewCycle();
    await adminLogs.addLog(`🌍 RUN GLOBAL (EXTRACTION) lancé – zone=${zone}`);
    await preRunChecks();

    // Statistiques extraction
    const modelsRequested = [
      "GFS",
      "ECMWF",
      "ICON",
      "HRRR",          // USA hi-res
      "UKMO",
      "DWD_ICON_EU",   // Europe hi-res
      "NASA_POWER",
      "OPENWEATHER",
    ];

    const modelStats = {};
    modelsRequested.forEach(m => modelStats[m] = { ok: 0, fail: 0, errors: [] });

    const points = enumerateCoveredPoints();
    let countriesTotal = new Set(points.map(p => p.country)).size;
    const countryOK = new Set();
    const countryFail = new Set();

    // 1) COLLECTE PRÉVISIONS multi-modèles (réel)
    for (const p of points) {
      let allOkForPoint = true;

      for (const model of modelsRequested) {
        try {
          let res;
          if (["GFS","ECMWF","ICON","HRRR","UKMO","DWD_ICON_EU"].includes(model)) {
            res = await pullOpenMeteo(model, p.lat, p.lon);
          } else if (model === "NASA_POWER") {
            res = await pullNasaPower(p.lat, p.lon);
          } else if (model === "OPENWEATHER") {
            res = await pullOpenWeather(p.lat, p.lon);
          }
          if (res?.ok) modelStats[model].ok++;
          else throw new Error(`${model} sans réponse ok`);
        } catch (err) {
          modelStats[model].fail++;
          modelStats[model].errors.push(`${p.country}/${p.region}: ${err.message}`);
          allOkForPoint = false;
        }
      }

      if (allOkForPoint) countryOK.add(p.country);
      else countryFail.add(p.country);
    }

    await adminLogs.addLog(`📡 Extraction modèles terminée: ${points.length} points, ${modelsRequested.length} modèles.`);

    // 2) ALERTES LOCALES/NATIONALES (physiques, sans IA)
    await adminLogs.addLog("🚨 Détection alertes locales/nationales (seuils physiques)...");
    // generateAlerts(lat, lon, country, region, continent)
    for (const p of points) {
      await generateAlerts(p.lat, p.lon, p.country, p.region, p.continent);
    }
    const alertsLocal = await getActiveAlerts();
    await adminLogs.addLog(`✅ Alertes locales/nationales: ${alertsLocal.length}`);

    // 3) ALERTES CONTINENTALES (fallback)
    await adminLogs.addLog("🌐 Calcul alertes continentales (fallback)...");
    let continentalAlerts = [];
    try {
      const cont = await runContinental(); // existant
      continentalAlerts = cont?.alerts || [];
      await adminLogs.addLog(`✅ Alertes continentales: ${continentalAlerts.length}`);
    } catch (e) {
      await adminLogs.addError("⚠️ runContinental: " + e.message);
    }

    // 4) FUSION MONDIALE brute (sans IA)
    let worldFusion = [];
    try {
      worldFusion = (await runWorldAlerts()) || [];
      await adminLogs.addLog(`🌎 Fusion mondiale brute: ${worldFusion.length} éléments`);
    } catch (e) {
      await adminLogs.addError("⚠️ Fusion mondiale: " + e.message);
    }

    // 5) CROSS-CHECK OFFICIEL (toujours sans IA)
    try {
      if (zone === "USA" || zone === "All") {
        const nws = await weatherGovService.crossCheck({}, alertsLocal);
        state.checkup = state.checkup || {};
        state.checkup.nwsComparison = nws;
        await adminLogs.addLog(`🇺🇸 NWS cross-check OK: ${nws?.summary || "n/a"}`);
      }
      if (zone === "Europe" || zone === "All") {
        const eu = await euroMeteoService.crossCheck({}, alertsLocal);
        state.checkup = state.checkup || {};
        state.checkup.euComparison = eu;
        await adminLogs.addLog(`🇪🇺 MeteoAlarm cross-check OK: ${eu?.summary || "n/a"}`);
      }
    } catch (e) {
      await adminLogs.addError("⚠️ Cross-check: " + e.message);
    }

    // 6) RAPPORT INTERMÉDIAIRE (partialReport) – pas d’IA ici
    const partialReport = {
      generatedAt: new Date().toISOString(),
      zoneRequested: zone,
      extraction: {
        points: points.length,
        countriesTotal,
        countriesOK: Array.from(countryOK),
        countriesFail: Array.from(countryFail),
      },
      models: Object.fromEntries(Object.entries(modelStats).map(([k,v]) => [
        k, { ok: v.ok, fail: v.fail, errors: v.errors.slice(0, 30) } // limiter taille
      ])),
      alerts: {
        localCount: alertsLocal.length,
        continentalCount: continentalAlerts.length,
      },
      world: {
        fusedCount: worldFusion.length,
      },
      note: "Rapport intermédiaire (extraction sans IA) prêt pour analyse IA J.E.A.N.",
    };

    // 7) Sauvegarde état moteur
    state.status = "extracted";
    state.lastRun = new Date();
    state.checkup = state.checkup || {};
    state.checkup.engineStatus = "OK-EXTRACTED";
    state.partialReport = partialReport;
    state.alertsLocal = alertsLocal;
    state.alertsContinental = continentalAlerts;
    state.alertsWorld = worldFusion;
    await saveEngineState(state);

    await adminLogs.addLog("✅ Étape 1 terminée (extraction SANS IA). Rapport intermédiaire prêt.");
    return { success: true, partialReport };
  } catch (e) {
    await adminLogs.addError("❌ RUN EXTRACTION échec: " + e.message);
    const s = await getEngineState();
    s.status = "fail";
    s.checkup = s.checkup || {};
    s.checkup.engineStatus = "FAIL";
    await saveEngineState(s);
    return { success: false, error: e.message };
  }
}

/* ---------------------------------------------
   🔁 Relance ciblée conservée (sans IA)
----------------------------------------------*/
export async function retryPhase(phase) {
  await adminLogs.addLog(`🔁 Relance phase (extraction) demandée: ${phase}`);
  // Ici on peut ajouter des relances fines si besoin.
  return { success: true };
}
