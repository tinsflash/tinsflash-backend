// services/engineState.js
// ✅ Centralise l'état du moteur TINSFLASH

let engineState = {
  runTime: null,
  models: { ok: [], ko: [] },
  sources: { ok: [], ko: [] },
  forecasts: {
    local: null,     // true = OK, false = KO, null = inconnu
    national: null,
    openData: null,
  },
  alerts: {
    local: null,
    national: null,
    continental: null,
    world: null,
  },
  ia: {
    forecasts: null,
    alerts: null,
  },
  logs: [],
  users: {}, // exemple: { BE: { free:0, premium:0, pro:0 } }
};

export function resetEngineState() {
  engineState = {
    runTime: null,
    models: { ok: [], ko: [] },
    sources: { ok: [], ko: [] },
    forecasts: { local: null, national: null, openData: null },
    alerts: { local: null, national: null, continental: null, world: null },
    ia: { forecasts: null, alerts: null },
    logs: [],
    users: {},
  };
}

export function saveEngineState(newState = {}) {
  engineState = { ...engineState, ...newState };
}

export function addLog(message, type = "info") {
  engineState.logs.push({
    timestamp: new Date().toISOString(),
    type,
    message,
  });
  if (engineState.logs.length > 200) engineState.logs.shift();
}

export function getEngineState() {
  return engineState;
}
