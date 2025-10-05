// ✅ PATH: services/superForecast.js
import {
  addEngineLog,
  addEngineError,
  updateEngineState,
  saveEngineState,
} from "./engineState.js";
import forecastService from "./forecastService.js";
import alertsService from "./alertsService.js";
import aiFusionService from "./aiFusionService.js"; // Fusion IA (GraphCast / Pangu / Gemini / GPT-5)
import { getGlobalTimestamp } from "./timeUtils.js";

/**
 * ⚙️ SUPERFORECAST
 * Cycle complet :
 *  1️⃣ Télécharge les modèles météo
 *  2️⃣ Fait la fusion IA
 *  3️⃣ Génère les alertes locales & continentales
 *  4️⃣ Sauvegarde l’état moteur complet
 */
export async function superForecast(zone = "Europe") {
  const cycleId = getGlobalTimestamp();
  await addEngineLog(`🌀 Démarrage SuperForecast pour la zone ${zone} [${cycleId}]`);
  await updateEngineState("status", "running");
  await updateEngineState("checkup.engineStatus", "RUNNING");
  await updateEngineState("currentCycleId", cycleId);

  // === 1️⃣ Chargement des modèles météo ===
  const models = ["ECMWF", "GFS", "ICON", "Meteomatics", "Copernicus", "NASA", "OpenWeather"];
  const modelResults = {};
  const errors = [];

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
  let fused = null;
  try {
    await addEngineLog("🧠 Fusion IA des modèles...");
    fused = await aiFusionService.fuseModels(modelResults, zone);
    if (!fused) throw new Error("Résultat IA vide ou invalide.");
    await updateEngineState("checkup.steps.fusionIA", "ok");
    await addEngineLog("✅ Fusion IA terminée avec succès.");
  } catch (err) {
    await updateEngineState("checkup.steps.fusionIA", "fail");
    await addEngineError(`❌ Fusion IA: ${err.message}`);
    errors.push(`[FusionIA] ${err.message}`);
  }

  // === 3️⃣ Génération des alertes ===
  let alerts = [];
  let continentalAlerts = [];
  try {
    await addEngineLog("🚨 Génération des alertes pour zones couvertes...");
    alerts = await alertsService.generateAlerts(zone, modelResults);
    await updateEngineState("checkup.steps.alertsCovered", "ok");
    await addEngineLog(`✅ ${alerts.length} alertes générées (zones couvertes).`);

    if (zone === "Europe" || zone === "USA") {
      await addEngineLog("🌍 Génération des alertes continentales...");
      continentalAlerts = await alertsService.generateContinentalAlerts(zone);
      await updateEngineState("checkup.steps.alertsContinental", "ok");
      await addEngineLog(`✅ ${continentalAlerts.length} alertes continentales générées.`);
    }
  } catch (err) {
    await updateEngineState("checkup.steps.alertsCovered", "fail");
    await addEngineError(`❌ Erreur génération alertes: ${err.message}`);
    errors.push(`[Alertes] ${err.message}`);
  }

  // === 4️⃣ Finalisation & sauvegarde ===
  const zonesCount =
    zone === "Europe"
      ? 33 // Europe élargie (UE27 + UK + CH + NO + SE + UA)
      : zone === "USA"
      ? 51 // 50 États + District of Columbia
      : 0;

  const state = {
    status: errors.length > 0 ? "fail" : "ok",
    lastRun: new Date(),
    checkup: {
      engineStatus: errors.length > 0 ? "FAIL" : "OK",
      zonesCovered: zonesCount,
      models: Object.fromEntries(models.map((m) => [m, modelResults[m] ? "ok" : "fail"])),
      steps: {
        superForecast: "ok",
        fusionIA: errors.find((e) => e.includes("FusionIA")) ? "fail" : "ok",
        alertsCovered: errors.find((e) => e.includes("Alertes")) ? "fail" : "ok",
        alertsContinental: "ok",
        deploy: "pending",
      },
    },
    finalReport: {
      forecasts: modelResults,
      fused,
      alerts,
      continentalAlerts,
    },
    engineErrors: errors.map((e) => ({ message: e, timestamp: new Date() })),
  };

  await saveEngineState(state);

  if (errors.length > 0) {
    await addEngineLog("⚠️ SuperForecast terminé avec erreurs. Voir engineErrors.");
  } else {
    await addEngineLog("✅ SuperForecast terminé avec succès complet.");
  }

  return {
    ok: errors.length === 0,
    errors,
    modelsLoaded: Object.keys(modelResults).length,
    alertsCount: alerts.length + continentalAlerts.length,
  };
}

export default { superForecast };
