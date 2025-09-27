// services/engineState.js
let engineState = {
  runTime: null,
  models: { ok: [], ko: [] },
  sources: { ok: [], ko: [] },
  forecasts: { local: false, national: false, openData: false },
  alerts: { local: false, national: false, continental: false, world: false },
  ia: { forecasts: false, alerts: false },
  users: {},
  logs: [],
};

// --- Helpers ---
function addLog(message, level = "info") {
  engineState.logs.push({
    timestamp: new Date().toISOString(),
    level,
    message,
  });
  if (engineState.logs.length > 200) engineState.logs.shift();
}

function saveEngineState(partial) {
  engineState = { ...engineState, ...partial };
  return engineState;
}

function getEngineState() {
  return engineState;
}

// --- Pour reset avant un nouveau run ---
function resetEngineState() {
  engineState.runTime = new Date().toISOString();
  engineState.models = { ok: [], ko: [] };
  engineState.sources = { ok: [], ko: [] };
  engineState.forecasts = { local: false, national: false, openData: false };
  engineState.alerts = { local: false, national: false, continental: false, world: false };
  engineState.ia = { forecasts: false, alerts: false };
  addLog("Nouvelle exécution initialisée", "system");
}

export { getEngineState, saveEngineState, addLog, resetEngineState };
