// services/runGlobal.js
// ⚡ Centrale nucléaire météo – Moteur atomique orchestral

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

import { generateAlerts, getActiveAlerts } from "./alertsService.js";
import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// Zones disponibles
import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";

export const ALL_ZONES = {
  ...EUROPE_ZONES,
  ...USA_ZONES,
};

// === Orchestrateur principal ===
export async function runGlobal(zone = "All") {
  const state = await getEngineState();
  try {
    addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})…`);
    state.runTime = new Date().toISOString();

    // Sécurisation checkup
    state.checkup = state.checkup || {};
    state.checkup.models = "PENDING";
    state.checkup.localForecasts = "PENDING";
    state.checkup.nationalForecasts = "PENDING";
    state.checkup.forecastsContinental = "PENDING";
    state.checkup.aiAlerts = "PENDING";
    state.checkup.alertsContinental = "PENDING";
    state.checkup.alertsWorld = "PENDING";
    state.checkup.engineStatus = "RUNNING";

    await saveEngineState(state);

    // =============================
    // 🔹 PHASE 1 : PRÉVISIONS ZONES COUVERTES
    // =============================
    addEngineLog("📡 Phase 1 – Prévisions zones couvertes (Europe/USA)...");
    let forecasts = {};

    if (zone === "Europe") {
      forecasts.Europe = await runGlobalEurope();
    } else if (zone === "USA") {
      forecasts.USA = await runGlobalUSA();
    } else if (zone === "All") {
      forecasts.Europe = await runGlobalEurope();
      forecasts.USA = await runGlobalUSA();
    }

    state.checkup.models = "OK";
    state.checkup.localForecasts = "OK";
    state.checkup.nationalForecasts = "OK";
    await saveEngineState(state);

    // =============================
    // 🔹 PHASE 2 : PRÉVISIONS CONTINENTALES (fallback)
    // =============================
    if (zone === "All") {
      addEngineLog("🌐 Phase 2 – Prévisions Continentales (fallback)...");
      const cont = await runContinental();
      forecasts.Continental = cont?.forecasts || {};
      state.forecastsContinental = forecasts.Continental;   // ✅ stocké
      state.checkup.forecastsContinental = "OK";
      await saveEngineState(state);
    }

    // =============================
    // 🔹 PHASE 3 : ALERTES LOCALES/NATIONALES
    // =============================
    addEngineLog("🚨 Phase 3 – Génération alertes locales/nationales (zones couvertes)...");
    for (const [country, zones] of Object.entries(ALL_ZONES)) {
      for (const z of zones) {
        await generateAlerts(z.lat, z.lon, country, z.region, zone);
      }
    }

    const alerts = await getActiveAlerts();
    state.alertsLocal = alerts;
    state.checkup.aiAlerts = alerts?.length > 0 ? "OK" : "FAIL";
    await saveEngineState(state);

    // =============================
    // 🔹 PHASE 4 : ALERTES CONTINENTALES (fallback)
    // =============================
    if (zone === "All") {
      addEngineLog("🚨 Phase 4 – Alertes Continentales (fallback)...");
      const contAlerts = await runContinental();
      state.alertsContinental = contAlerts?.alerts || [];
      state.checkup.alertsContinental = state.alertsContinental.length > 0 ? "OK" : "FAIL";
      await saveEngineState(state);
    }

    // =============================
    // 🔹 PHASE 5 : ALERTES MONDIALES
    // =============================
    if (zone === "All") {
      addEngineLog("🌍 Phase 5 – Fusion mondiale des alertes...");
      const world = await runWorldAlerts();
      state.alertsWorld = world || [];
      state.checkup.alertsWorld = world ? "OK" : "FAIL";
      await saveEngineState(state);
    }

    // =============================
    // 🔹 PHASE 6 : IA CHEF D’ORCHESTRE
    // =============================
    addEngineLog("🤖 Phase 6 – IA Chef d’orchestre (fusion finale)…");

    const aiInput = { forecasts, alerts: state.alertsLocal, world: state.alertsWorld };
    let aiFusion;
    try {
      aiFusion = await askOpenAI(
        "Tu es l’IA chef d’orchestre météo nucléaire. Analyse et fusionne.",
        JSON.stringify(aiInput)
      );
    } catch (e) {
      addEngineError("⚠️ IA Chef d’orchestre non disponible : " + e.message);
      aiFusion = "{}";
    }

    let finalOutput;
    try {
      finalOutput = JSON.parse(aiFusion);
    } catch {
      finalOutput = { raw: aiFusion };
    }

    state.finalReport = finalOutput;
    state.checkup.engineStatus = "OK";
    await saveEngineState(state);

    addEngineLog("✅ RUN GLOBAL terminé avec succès.");
    return { forecasts, alerts, final: finalOutput };
  } catch (err) {
    await addEngineError("❌ Erreur RUN GLOBAL : " + (err.message || err));

    const failedState = await getEngineState();
    failedState.checkup = failedState.checkup || {};
    failedState.checkup.engineStatus = "FAIL";
    await saveEngineState(failedState);

    addEngineLog(`❌ RUN GLOBAL échec (${zone})`);
    return { error: err.message };
  }
}
