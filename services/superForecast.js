// PATH: services/superForecast.js
// ⚙️ SuperForecast – moteur IA fusion multi-modèles (ECMWF / GFS / ICON / etc.)

import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";
import forecastService from "./forecastService.js";
import * as alertsService from "./alertsService.js";
import aiFusionService from "./aiFusionService.js"; // Fusion IA (GraphCast / Pangu / Gemini / GPT-5)
import { getGlobalTimestamp } from "./timeUtils.js";

/**
 * 🔥 Fonction principale : superForecast()
 * Lance un cycle complet de prévision et d'analyse
 * - Récupération des modèles météo
 * - Fusion IA
 * - Détection d'alertes
 * - Sauvegarde dans l'état moteur
 */
export async function superForecast(zone = "Europe") {
  const cycleId = getGlobalTimestamp();
  await addEngineLog(`🌀 Démarrage SuperForecast pour la zone ${zone} [${cycleId}]`);

  // Récupérer l’état actuel du moteur
  const state = await getEngineState();
  state.status = "running";
  state.checkup = state.checkup || {};
  state.checkup.engineStatus = "RUNNING";
  state.currentCycleId = cycleId;

  await saveEngineState(state);

  // === Liste des modèles ===
  const models = [
    "ECMWF",
    "GFS",
    "ICON",
    "Meteomatics",
    "Copernicus",
    "NASA",
    "OpenWeather",
    "Wetter3", // nouveau modèle interne
  ];

  const modelResults = {};
  const errors = [];

  /* === 1️⃣ Chargement des modèles météo === */
  for (const model of models) {
    try {
      await addEngineLog(`📡 Chargement modèle ${model}...`);
      const data = await forecastService.getModelForecast(model, zone);

      if (data && Object.keys(data).length > 0) {
        modelResults[model] = data;
        state.checkup.models = state.checkup.models || {};
        state.checkup.models[model] = "ok";
        await addEngineLog(`✅ ${model} chargé (${Object.keys(data).length} points).`);
      } else {
        state.checkup.models[model] = "fail";
        throw new Error(`${model} a renvoyé des données vides.`);
      }
    } catch (err) {
      errors.push(`[${model}] ${err.message}`);
      state.checkup.models = state.checkup.models || {};
      state.checkup.models[model] = "fail";
      await addEngineError(`❌ ${model}: ${err.message}`);
    }
  }

  /* === 2️⃣ Fusion IA === */
  try {
    await addEngineLog("🧠 Fusion IA des modèles...");
    const fused = await aiFusionService.fuseModels(modelResults, zone);
    if (!fused) throw new Error("Résultat IA vide ou invalide.");
    state.checkup.steps = state.checkup.steps || {};
    state.checkup.steps.fusionIA = "ok";
    await addEngineLog("✅ Fusion IA terminée avec succès.");
  } catch (err) {
    state.checkup.steps = state.checkup.steps || {};
    state.checkup.steps.fusionIA = "fail";
    await addEngineError(`❌ Fusion IA: ${err.message}`);
    errors.push(`[FusionIA] ${err.message}`);
  }

  /* === 3️⃣ Génération des alertes === */
  try {
    await addEngineLog("🚨 Génération des alertes pour zones couvertes...");
    const alerts = await alertsService.generateAlerts(zone, modelResults);
    state.checkup.steps.alertsCovered = "ok";
    await addEngineLog(`✅ ${alerts.length} alertes générées (zones couvertes).`);

    if (zone === "Europe" || zone === "USA") {
      await addEngineLog("🌍 Génération des alertes continentales...");
      const cont = await alertsService.generateContinentalAlerts(zone);
      state.checkup.steps.alertsContinental = "ok";
      await addEngineLog(`✅ ${cont.length} alertes continentales générées.`);
    }
  } catch (err) {
    state.checkup.steps.alertsCovered = "fail";
    await addEngineError(`❌ Erreur génération alertes: ${err.message}`);
    errors.push(`[Alertes] ${err.message}`);
  }

  /* === 4️⃣ Finalisation & sauvegarde === */
  state.status = errors.length > 0 ? "fail" : "ok";
  state.lastRun = new Date();
  state.checkup.engineStatus = errors.length > 0 ? "FAIL" : "OK";
  state.finalReport = { forecasts: modelResults };
  state.engineErrors = errors.map(e => ({ message: e, timestamp: new Date() }));

  await saveEngineState(state);

  if (errors.length > 0) {
    await addEngineLog("⚠️ SuperForecast terminé avec erreurs. Voir engineErrors.");
  } else {
    await addEngineLog("✅ SuperForecast terminé avec succès complet.");
  }

  return { ok: errors.length === 0, errors, modelsLoaded: Object.keys(modelResults).length };
}

// ✅ Compatibilité rétro
export const runSuperForecast = superForecast;
export default { superForecast, runSuperForecast };
