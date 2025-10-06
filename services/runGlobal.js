// PATH: services/runGlobal.js
// ⚙️ Moteur orchestral TINSFLASH – Run Global unifié, logué et relançable par phase

import mongoose from "mongoose";
import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";
import { generateAlerts, getActiveAlerts, runGlobalAlerts } from "./alertsService.js";
import { askOpenAI } from "./openaiService.js";
import {
  addEngineLog,
  addEngineError,
  getEngineState,
  saveEngineState,
} from "./engineState.js";
import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";
import weatherGovService from "./weatherGovService.js";
import euroMeteoService from "./euroMeteoService.js";

export const ALL_ZONES = { ...EUROPE_ZONES, ...USA_ZONES };

/* ------------------------------------------------------------------
   🧩 PRE-CHECK
------------------------------------------------------------------ */
async function preRunChecks() {
  const errors = [];

  if (mongoose.connection.readyState !== 1)
    errors.push({ code: "DB_CONN", msg: "MongoDB non connecté" });

  const requiredEnv = ["MONGO_URI", "OPENAI_API_KEY"];
  for (const key of requiredEnv)
    if (!process.env[key])
      errors.push({ code: "MISSING_ENV", msg: `Variable ${key} manquante` });

  try {
    const resp = await fetch("https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&hourly=temperature_2m");
    if (!resp.ok) errors.push({ code: "SRC_DOWN", msg: `Service Open-Meteo non accessible (HTTP ${resp.status})` });
  } catch {
    errors.push({ code: "SRC_DOWN", msg: "Impossible d’accéder à Open-Meteo" });
  }

  if (errors.length) {
    for (const e of errors) await addEngineError(`PRECHECK ❌ ${e.code}: ${e.msg}`);
    throw new Error(`Pré-check échoué (${errors.length} erreur(s))`);
  }

  await addEngineLog("✅ Pré-checks terminés avec succès");
}

/* ------------------------------------------------------------------
   🚀 RUN GLOBAL
------------------------------------------------------------------ */
export async function runGlobal(zone = "All") {
  const state = await getEngineState();
  try {
    await addEngineLog(`🧩 Pré-check du moteur (${zone})...`);
    await preRunChecks();

    await addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})`);
    state.status = "running";
    state.lastRun = new Date();
    state.checkup.engineStatus = "RUNNING";
    await saveEngineState(state);

    /* === PHASE 1 : Prévisions === */
    await addEngineLog("📡 Phase 1 – Prévisions (Europe / USA)");
    const forecasts = {};
    if (zone === "Europe" || zone === "All")
      forecasts.Europe = await runGlobalEurope().catch((e) => addEngineError("❌ Europe : " + e.message));
    if (zone === "USA" || zone === "All")
      forecasts.USA = await runGlobalUSA().catch((e) => addEngineError("❌ USA : " + e.message));

    /* === PHASE 2 : Continental === */
    if (zone === "All") {
      await addEngineLog("🌐 Phase 2 – Prévisions continentales (fallback)");
      try {
        const cont = await runContinental();
        forecasts.Continental = cont?.forecasts || {};
        state.forecastsContinental = forecasts.Continental;
        await addEngineLog("✅ Continental OK");
      } catch (e) {
        await addEngineError("⚠️ Continental : " + e.message);
      }
    }

    /* === PHASE 3 : Alertes locales/nationales === */
    await addEngineLog("🚨 Phase 3 – Génération alertes locales/nationales...");
    for (const [country, zones] of Object.entries(ALL_ZONES)) {
      for (const z of zones) {
        const lat = z.lat ?? z.latitude;
        const lon = z.lon ?? z.longitude;
        if (!lat || !lon) continue;
        await generateAlerts(lat, lon, country, z.region ?? z.name ?? "Inconnu", zone);
      }
    }
    const alerts = await getActiveAlerts();
    state.alertsLocal = alerts;
    await addEngineLog(`✅ ${alerts.length} alertes locales/nationales générées`);

    /* === 🧠 PHASE 3B : RUN GLOBAL ALERTS COMPLET === */
    if (zone === "All") {
      await addEngineLog("🌎 Phase 3B – Lancement moteur global des alertes (fusion zones + continental)...");
      try {
        const globalResults = await runGlobalAlerts();
        state.alertsGlobal = globalResults;
        await addEngineLog(`✅ ${globalResults.length} alertes globales consolidées`);
      } catch (e) {
        await addEngineError("⚠️ Erreur runGlobalAlerts : " + e.message);
      }
    }

    /* === PHASE 4 : Alertes continentales === */
    if (zone === "All") {
      await addEngineLog("🌎 Phase 4 – Alertes continentales...");
      try {
        const cont = await runContinental();
        state.alertsContinental = cont?.alerts || [];
        await addEngineLog(`✅ ${state.alertsContinental.length} alertes continentales`);
      } catch (e) {
        await addEngineError("⚠️ Continental alertes : " + e.message);
      }
    }

    /* === PHASE 5 : Fusion mondiale === */
    if (zone === "All") {
      await addEngineLog("🌍 Phase 5 – Fusion mondiale des alertes...");
      const world = await runWorldAlerts().catch((e) =>
        addEngineError("⚠️ Fusion mondiale : " + e.message)
      );
      state.alertsWorld = world || [];
      await addEngineLog(`✅ Fusion mondiale terminée (${world?.length || 0})`);
    }

    /* === PHASE 6 : Fusion IA J.E.A.N === */
    await addEngineLog("🤖 Phase 6 – Fusion IA J.E.A.N...");
    try {
      const aiInput = { forecasts, alerts: state.alertsLocal, world: state.alertsWorld };
      const aiResponse = await askOpenAI(
        "Tu es J.E.A.N., système d’analyse météo nucléaire. Fournis une synthèse lisible, concise et fiable.",
        JSON.stringify(aiInput)
      );
      state.finalReport = JSON.parse(aiResponse || "{}");
      await addEngineLog("✅ Fusion IA terminée");
    } catch (e) {
      await addEngineError("⚠️ IA indisponible : " + e.message);
    }

    /* === PHASE 7 : Cross-check (NWS / MeteoAlarm) === */
    if (zone === "USA" || zone === "All") {
      try {
        const nws = await weatherGovService.crossCheck(forecasts.USA, alerts);
        state.checkup.nwsComparison = nws;
        await addEngineLog(`🇺🇸 NWS OK : ${nws.summary}`);
      } catch (e) {
        await addEngineError("⚠️ NWS : " + e.message);
      }
    }
    if (zone === "Europe" || zone === "All") {
      try {
        const eu = await euroMeteoService.crossCheck(forecasts.Europe, alerts);
        state.checkup.euComparison = eu;
        await addEngineLog(`🇪🇺 MeteoAlarm OK : ${eu.summary}`);
      } catch (e) {
        await addEngineError("⚠️ EU : " + e.message);
      }
    }

    /* === FINALISATION === */
    state.status = "ok";
    state.checkup.engineStatus = "OK";
    state.lastRun = new Date();
    await saveEngineState(state);
    await addEngineLog("✅ RUN GLOBAL terminé");
    return { success: true, alerts };
  } catch (e) {
    await addEngineError("❌ RUN GLOBAL échec : " + e.message);
    state.status = "fail";
    await saveEngineState(state);
    return { success: false, error: e.message };
  }
}

/* ------------------------------------------------------------------
   🔁 RELANCE CIBLÉE D’UNE PHASE (retryPhase)
------------------------------------------------------------------ */
export async function retryPhase(phase) {
  const state = await getEngineState();
  await addEngineLog(`🔁 Relance ciblée de la phase ${phase}`);
  try {
    switch (phase) {
      case "IA":
        const aiInput = {
          forecasts: state.forecastsContinental,
          alerts: state.alertsLocal,
          world: state.alertsWorld,
        };
        const aiResponse = await askOpenAI(
          "Analyse IA J.E.A.N. : synthèse globale",
          JSON.stringify(aiInput)
        );
        state.finalReport = JSON.parse(aiResponse || "{}");
        await addEngineLog("✅ Relance IA terminée");
        break;

      case "ALERTES":
        await addEngineLog("🔁 Régénération des alertes locales/nationales...");
        const alerts = await getActiveAlerts();
        state.alertsLocal = alerts;
        await addEngineLog("✅ Alertes rechargées");
        break;

      default:
        throw new Error("Phase non reconnue");
    }
    await saveEngineState(state);
    return { success: true };
  } catch (err) {
    await addEngineError(`⚠️ Erreur relance phase ${phase}: ${err.message}`);
    return { success: false, error: err.message };
  }
}
