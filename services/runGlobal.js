// services/runGlobal.js
import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { generateAlerts, getActiveAlerts } from "./alertsService.js";
import { askOpenAI } from "./openaiService.js";
import { saveEngineState, getEngineState } from "./engineState.js";
import { addLog as addEngineLog, addError as addEngineError } from "./adminLogs.js";

// === Zones disponibles ===
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
    await addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})…`);
    state.runTime = new Date().toISOString();
    state.checkup = {
      models: "PENDING",
      localForecasts: "PENDING",
      nationalForecasts: "PENDING",
      aiAlerts: "PENDING",
      engineStatus: "RUNNING",
    };
    await saveEngineState(state);

    // Phase 1 : Prévisions
    await addEngineLog("📡 Phase 1 – Prévisions zones couvertes…");
    let forecasts = {};

    if (zone === "Europe") {
      forecasts.Europe = await runGlobalEurope();
    } else if (zone === "USA") {
      forecasts.USA = await runGlobalUSA();
    } else if (zone === "All") {
      forecasts.Europe = await runGlobalEurope();
      forecasts.USA = await runGlobalUSA();
    } else {
      throw new Error(`Zone inconnue: ${zone}`);
    }

    state.checkup.models = "OK";
    state.checkup.localForecasts = "OK";
    state.checkup.nationalForecasts = "OK";
    await saveEngineState(state);

    // Phase 2 : Alertes
    await addEngineLog("🚨 Phase 2 – Génération alertes…");
    for (const [country, zones] of Object.entries(ALL_ZONES)) {
      for (const z of zones) {
        await generateAlerts(z.lat, z.lon, country, z.region, zone);
      }
    }

    const alerts = await getActiveAlerts();
    state.checkup.aiAlerts = alerts?.length > 0 ? "OK" : "FAIL";
    await saveEngineState(state);

    // Phase 3 : IA Chef d’orchestre
    await addEngineLog("🤖 Phase 3 – Fusion prévisions + alertes…");
    const prompt = `
Tu es l'IA nucléaire météo. Donne un état final clair.
Format JSON strict :
{ "resume": "...", "points_forts": ["..."], "alertes_majeures": [...], "fiabilite_globale": "...%", "message_utilisateur": "..." }
    `;
    const aiFusion = await askOpenAI("Fusion météo", JSON.stringify({ forecasts, alerts }));

    let finalOutput;
    try {
      finalOutput = JSON.parse(aiFusion);
    } catch {
      finalOutput = { raw: aiFusion };
    }

    state.finalReport = finalOutput;
    state.checkup.engineStatus = "OK";
    await saveEngineState(state);

    await addEngineLog("✅ RUN GLOBAL terminé avec succès");
    return { forecasts, alerts, final: finalOutput };
  } catch (err) {
    await addEngineError(err.message || "Erreur RUN GLOBAL");
    state.checkup.engineStatus = "FAIL";
    await saveEngineState(state);
    await addEngineLog(`❌ RUN GLOBAL échec (${zone})`);
    return { error: err.message };
  }
}
