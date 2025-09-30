// services/runGlobal.js
// ⚡ Centrale nucléaire météo – Moteur atomique orchestral
// Étapes : Prévisions → Alertes brutes → Consolidation IA → IA Chef d’orchestre final

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { generateAlerts, getActiveAlerts } from "./alertsService.js";
import { consolidateAlerts } from "./consolidateAlerts.js";
import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// === Zones disponibles (Europe + USA, extensible) ===
import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";

export const ALL_ZONES = {
  ...EUROPE_ZONES,
  ...USA_ZONES,
  // Ajout futur : CANADA_ZONES, AFRICA_ZONES, etc.
};

// === Orchestrateur principal ===
export async function runGlobal(zone = "All") {
  const state = getEngineState();
  try {
    addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})…`);
    state.runTime = new Date().toISOString();
    state.checkup = {
      models: "PENDING",
      localForecasts: "PENDING",
      nationalForecasts: "PENDING",
      aiAlerts: "PENDING",
      engineStatus: "RUNNING",
    };
    saveEngineState(state);

    // =============================
    // 🔹 PHASE 1 : PRÉVISIONS
    // =============================
    addEngineLog("📡 Phase 1 – Prévisions zones couvertes…");
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
    saveEngineState(state);

    // =============================
    // 🔹 PHASE 2 : ALERTES BRUTES
    // =============================
    addEngineLog("🚨 Phase 2 – Génération alertes zones couvertes + continentales…");
    for (const [country, zones] of Object.entries(ALL_ZONES)) {
      for (const z of zones) {
        await generateAlerts(z.lat, z.lon, country, z.region, zone);
      }
    }

    const rawAlerts = await getActiveAlerts();

    // =============================
    // 🔹 PHASE 2bis : CONSOLIDATION
    // =============================
    addEngineLog("📊 Phase 2bis – Consolidation des alertes brutes…");
    const consolidatedAlerts = await consolidateAlerts(rawAlerts);

    state.checkup.aiAlerts = consolidatedAlerts?.length > 0 ? "OK" : "FAIL";
    saveEngineState(state);

    // =============================
    // 🔹 PHASE 3 : IA CHEF D’ORCHESTRE
    // =============================
    addEngineLog("🤖 Phase 3 – IA Chef d’orchestre (fusion prévisions + alertes)…");

    const prompt = `
Tu es l'intelligence artificielle nucléaire météo.
Objectif : produire un état final unique cohérent.
Tu reçois :
- Prévisions enrichies (locales et nationales)
- Alertes consolidées (locales, nationales, continentales)
- Facteurs externes (relief, climat, altitude intégrés en amont)

Consignes :
1. Vérifie la cohérence entre prévisions et alertes.
2. Ajuste si besoin : une alerte peut renforcer une prévision, une prévision peut confirmer une alerte.
3. Sors un rapport final clair et structuré :
   {
     "resume": "...",
     "points_forts": ["..."],
     "alertes_majeures": [...],
     "fiabilite_globale": "…%",
     "message_utilisateur": "Bulletin simplifié grand public"
   }
4. Format JSON strict.
    `;

    const aiFusion = await askOpenAI(
      "Tu es l’IA chef d’orchestre de la centrale nucléaire météo.",
      JSON.stringify({ forecasts, alerts: consolidatedAlerts })
    );

    let finalOutput;
    try {
      finalOutput = JSON.parse(aiFusion);
    } catch {
      finalOutput = { raw: aiFusion };
    }

    state.finalReport = finalOutput;
    state.checkup.engineStatus = "OK";
    saveEngineState(state);

    addEngineLog("✅ RUN GLOBAL terminé avec succès (Prévisions + Alertes + IA Finales)");
    return { forecasts, alerts: consolidatedAlerts, final: finalOutput };
  } catch (err) {
    addEngineError(err.message || "Erreur RUN GLOBAL");
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineLog(`❌ RUN GLOBAL échec (${zone})`);
    return { error: err.message };
  }
}
