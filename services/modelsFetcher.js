// services/modelsFetcher.js
// 🛰️ Orchestration et exécution parallèle des modèles météo
// Fusionne, pondère et renvoie les données consolidées pour l’IA J.E.A.N.

import MODELS from "./models.js";
import { addEngineLog, addEngineError } from "./engineState.js";

export async function fetchAllModels(lat, lon) {
  const results = {};
  await addEngineLog(`🌍 Lancement extraction pour coordonnées [${lat}, ${lon}]`, "info", "modelsFetcher");

  const entries = Object.entries(MODELS);

  for (const [key, model] of entries) {
    try {
      await addEngineLog(`📡 Fetch ${model.name}`, "info", "modelsFetcher");
      const data = await model.fn(lat, lon);
      results[key] = data;
    } catch (err) {
      await addEngineError(`❌ Erreur ${model.name}: ${err.message}`, "modelsFetcher");
      results[key] = { error: err.message };
    }
  }

  await addEngineLog("✅ Tous les modèles ont été exécutés", "success", "modelsFetcher");
  return results;
}

export async function mergeModelResults(results) {
  const valid = Object.values(results).filter((r) => !r.error);

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  return {
    source: "Fusion IA TINSFLASH",
    temperature: avg(valid.map((r) => r.temperature).filter((v) => v !== null)),
    precipitation: avg(valid.map((r) => r.precipitation).filter((v) => v !== null)),
    humidity: avg(valid.map((r) => r.humidity).filter((v) => v !== null)),
    windspeed: avg(valid.map((r) => r.windspeed).filter((v) => v !== null)),
    pressure: avg(valid.map((r) => r.pressure).filter((v) => v !== null)),
    reliability: avg(valid.map((r) => r.reliability || 0)),
  };
}
