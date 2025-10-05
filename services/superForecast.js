// PATH: services/superForecast.js
import { addEngineLog, addEngineError, updateEngineState, saveEngineState } from "./engineState.js";
import forecastService from "./forecastService.js";
import * as alertsService from "./alertsService.js";
import aiFusionService from "./aiFusionService.js"; // fusion IA (GraphCast / Pangu / Gemini / GPT5)
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
  await updateEngineState("status", "running");
  await updateEngineState("checkup.engineStatus", "RUNNING");
  await updateEngineState("currentCycleId", cycleId);

  const models = ["ECMWF", "GFS", "ICON", "Meteomatics", "Copernicus", "NASA", "OpenWeather"];
  const modelResults = {};
  const errors = [];

  // === 1️⃣ Chargement des modèles météo ===
  for (const model of models) {
    try {
      await addEngineLog(`📡 Chargement modèle ${model}...`);
      const data = await forecastService.getModelForecast(model, zone);
      if (data && Object.keys(data).length > 0) {
        modelResults[model] = data;
        await updateEngineState(`checkup.models.${model}`, "ok");
        await addEngineLog(`✅ ${model} chargé (${Object.keys(data).length} points).`);
      } else {
        await updateEngineState(`checkup.models.${model}`, "fail");
        throw new Error(`${model} a renvoyé des données vides.`);
      }
    } catch (err) {
      errors.push(`[${model}] ${err.message}`);
      await updateEngineState(`checkup.models.${model}`, "fail");
      await addEngineError(`❌ ${model}: ${err.message}`);
    }
  }

  // === 2️⃣ Fusion IA ===
  try {
    await addEngineLog("🧠 Fusion IA des modèles...");
    const fused = await aiFusionService.fuseModels(modelResults, zone);
    if (!fused) throw new Error("Résultat IA vide ou invalide.");
    await updateEngineState("checkup.steps.fusionIA", "ok");
    await addEngineLog("✅ Fusion IA terminée avec succès.");
  } catch (err) {
    await updateEngineState("checkup.steps.fusionIA", "fail");
    await addEngineError(`❌ Fusion IA: ${err.message}`);
    errors.push(`[FusionIA] ${err.message}`);
  }

  // === 3️⃣ Génération des alertes ===
  try {
    await addEngineLog("🚨 Génération des alertes pour zones couvertes...");
    const alerts = await alertsService.generateAlerts(zone, modelResults);
    await updateEngineState("checkup.steps.alertsCovered", "ok");
    await addEngineLog(`✅ ${alerts.length} alertes générées (zones couvertes).`);

    // Génération des alertes continentales
    if (zone === "Europe" || zone === "USA") {
      await addEngineLog("🌍 Génération des alertes continentales...");
      const cont = await alertsService.generateContinentalAlerts(zone);
      await updateEngineState("checkup.steps.alertsContinental", "ok");
      await addEngineLog(`✅ ${cont.length} alertes continentales générées.`);
    }
  } catch (err) {
    await updateEngineState("checkup.steps.alertsCovered", "fail");
    await addEngineError(`❌ Erreur génération alertes: ${err.message}`);
    errors.push(`[Alertes] ${err.message}`);
  }

  // === 4️⃣ Finalisation & sauvegarde ===
  const state = {
    status: errors.length > 0 ? "fail" : "ok",
    lastRun: new Date(),
    checkup: {
      engineStatus: errors.length > 0 ? "FAIL" : "OK",
      zonesCovered: zone === "Europe" ? 30 : 1, // MAJ: plus de 27 pays
      models: Object.fromEntries(models.map(m => [m, modelResults[m] ? "ok" : "fail"])),
      steps: {
        superForecast: "ok",
        fusionIA: errors.find(e => e.includes("FusionIA")) ? "fail" : "ok",
        alertsCovered: errors.find(e => e.includes("Alertes")) ? "fail" : "ok",
        alertsContinental: "ok",
        deploy: "pending",
      },
    },
    finalReport: { forecasts: modelResults },
    engineErrors: errors.map(e => ({ message: e, timestamp: new Date() })),
  };

  await saveEngineState(state);

  if (errors.length > 0) {
    await addEngineLog("⚠️ SuperForecast terminé avec erreurs. Voir engineErrors.");
  } else {
    await addEngineLog("✅ SuperForecast terminé avec succès complet.");
  }

  return { ok: errors.length === 0, errors, modelsLoaded: Object.keys(modelResults).length };
}

// ✅ Compatibilité rétro pour forecastService et autres modules
export const runSuperForecast = superForecast;

export default { superForecast, runSuperForecast };
