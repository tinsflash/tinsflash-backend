// PATH: services/runGlobal.js
// ⚙️ Moteur orchestral TINSFLASH – Run Global réel et connecté
// ✅ Version intégrée avec PHASE 9 : évolution automatique des alertes

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

import { generateAlerts, getActiveAlerts } from "./alertsService.js";
import { askOpenAI } from "./openaiService.js";
import { addEngineLog, addEngineError, getEngineState, saveEngineState } from "./engineState.js";
import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";

import weatherGovService from "./weatherGovService.js"; // 🇺🇸 NWS
import euroMeteoService from "./euroMeteoService.js";   // 🇪🇺 MeteoAlarm
import { runEvolution } from "./evolution.js";          // ♻️ Nouveau suivi des alertes

export const ALL_ZONES = { ...EUROPE_ZONES, ...USA_ZONES };

/**
 * 🌍 Fonction principale : orchestrateur global du moteur
 * @param {"Europe"|"USA"|"All"} zone
 */
export async function runGlobal(zone = "All") {
  const state = await getEngineState();

  try {
    await addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})`);
    state.status = "running";
    state.lastRun = new Date();
    state.checkup.engineStatus = "RUNNING";
    await saveEngineState(state);

    // === PHASE 1 : Prévisions zones couvertes ===
    await addEngineLog("📡 Phase 1 – Prévisions zones couvertes (Europe / USA)");
    const forecasts = {};
    if (zone === "Europe" || zone === "All") {
      forecasts.Europe = await runGlobalEurope();
      await addEngineLog("✅ Prévisions Europe OK");
    }
    if (zone === "USA" || zone === "All") {
      forecasts.USA = await runGlobalUSA();
      await addEngineLog("✅ Prévisions USA OK");
    }
    state.checkup.models = "OK";
    state.checkup.localForecasts = "OK";
    await saveEngineState(state);

    // === PHASE 2 : Prévisions continentales (fallback) ===
    if (zone === "All") {
      await addEngineLog("🌐 Phase 2 – Prévisions continentales (fallback)...");
      const cont = await runContinental();
      forecasts.Continental = cont?.forecasts || {};
      state.forecastsContinental = forecasts.Continental;
      state.checkup.forecastsContinental = "OK";
      await addEngineLog("✅ Prévisions continentales terminées");
      await saveEngineState(state);
    }

    // === PHASE 3 : Génération alertes locales/nationales ===
    await addEngineLog("🚨 Phase 3 – Génération alertes locales/nationales...");
    for (const [country, zones] of Object.entries(ALL_ZONES)) {
      for (const z of zones) {
        const lat = z.lat ?? z.latitude;
        const lon = z.lon ?? z.longitude;
        const region = z.region ?? z.name ?? "Inconnu";
        if (!lat || !lon) {
          await addEngineError(`⚠️ Coordonnées manquantes pour ${country} - ${region}`);
          continue;
        }
        await generateAlerts(lat, lon, country, region, zone);
      }
    }
    const alerts = await getActiveAlerts();
    state.alertsLocal = alerts;
    state.checkup.aiAlerts = alerts?.length ? "OK" : "NONE";
    await addEngineLog(`✅ ${alerts?.length || 0} alertes locales/nationales générées`);
    await saveEngineState(state);

    // === PHASE 4 : Alertes continentales ===
    if (zone === "All") {
      await addEngineLog("🌎 Phase 4 – Génération alertes continentales...");
      const cont = await runContinental();
      state.alertsContinental = cont?.alerts || [];
      state.checkup.alertsContinental = state.alertsContinental.length ? "OK" : "NONE";
      await addEngineLog(`✅ ${state.alertsContinental.length} alertes continentales`);
      await saveEngineState(state);
    }

    // === PHASE 5 : Fusion mondiale des alertes ===
    if (zone === "All") {
      await addEngineLog("🌍 Phase 5 – Fusion mondiale des alertes...");
      const world = await runWorldAlerts();
      state.alertsWorld = world || [];
      state.checkup.alertsWorld = world?.length ? "OK" : "NONE";
      await addEngineLog(`✅ Fusion mondiale terminée (${world?.length || 0} alertes)`);
      await saveEngineState(state);
    }

    // === PHASE 6 : Fusion IA J.E.A.N. ===
    await addEngineLog("🤖 Phase 6 – Fusion IA J.E.A.N (analyse globale)...");
    try {
      const aiInput = { forecasts, alerts: state.alertsLocal, world: state.alertsWorld };
      const aiResponse = await askOpenAI(
        "Tu es J.E.A.N., système météorologique d’analyse et de fusion. Donne une synthèse fiable et lisible.",
        JSON.stringify(aiInput)
      );
      let fusionResult;
      try {
        fusionResult = JSON.parse(aiResponse);
      } catch {
        fusionResult = { raw: aiResponse };
      }
      state.finalReport = fusionResult;
      await addEngineLog("✅ Fusion IA J.E.A.N terminée");
    } catch (err) {
      await addEngineError("⚠️ IA J.E.A.N indisponible : " + err.message);
    }

    // === PHASE 7 : Cross-check Weather.gov (USA) ===
    if (zone === "USA" || zone === "All") {
      await addEngineLog("🇺🇸 Vérification en temps réel avec Weather.gov (NWS)...");
      try {
        const nwsCheck = await weatherGovService.crossCheck(forecasts.USA, state.alertsLocal);
        state.checkup.nwsComparison = nwsCheck;
        await addEngineLog(`✅ NWS cross-check terminé : ${nwsCheck.summary}`);
      } catch (e) {
        await addEngineError("⚠️ Erreur NWS cross-check : " + e.message);
      }
      await saveEngineState(state);
    }

    // === PHASE 8 : Cross-check MeteoAlarm (Europe) ===
    if (zone === "Europe" || zone === "All") {
      await addEngineLog("🇪🇺 Vérification en temps réel avec MeteoAlarm (EUMETNET)...");
      try {
        const euroCheck = await euroMeteoService.crossCheck(forecasts.Europe, state.alertsLocal);
        state.checkup.euComparison = euroCheck;
        await addEngineLog(`✅ MeteoAlarm cross-check terminé : ${euroCheck.summary}`);
      } catch (e) {
        await addEngineError("⚠️ Erreur MeteoAlarm cross-check : " + e.message);
      }
      await saveEngineState(state);
    }

    // === PHASE 9 : Évolution automatique des alertes ===
    await addEngineLog("♻️ PHASE 9 – Évolution automatique des alertes...");
    try {
      const evo = await runEvolution();
      state.checkup.alertEvolution = `OK (+${evo.created?.length || 0} / ${evo.updated?.length || 0} / ${evo.deleted?.length || 0})`;
      await addEngineLog(`✅ Évolution terminée : ${evo.updated?.length || 0} mises à jour, ${evo.deleted?.length || 0} supprimées`);
    } catch (err) {
      await addEngineError("⚠️ Erreur évolution alertes : " + err.message);
    }

    // === Finalisation ===
    state.status = "ok";
    state.checkup.engineStatus = "OK";
    state.lastRun = new Date();
    await saveEngineState(state);
    await addEngineLog("✅ RUN GLOBAL terminé avec succès complet");

    return {
      forecasts,
      alerts,
      world: state.alertsWorld || [],
      finalReport: state.finalReport || {},
    };
  } catch (err) {
    await addEngineError("❌ Erreur RUN GLOBAL : " + err.message);
    state.status = "fail";
    state.checkup.engineStatus = "FAIL";
    await saveEngineState(state);
    await addEngineLog("❌ RUN GLOBAL échec");
    return { success: false, error: err.message };
  }
}
