// services/engineState.js

let engineState = {
  runTime: null,
  zonesCovered: {},   // { BE:true, FR:true, ... }
  sources: {},        // modèles météo utilisés
  logs: [],           // [{timestamp, message}]
  errors: [],         // [{timestamp, error}]
  alertsList: []      // [{id, country, type, reliability, firstDetected}]
};

// === Fonctions principales ===
export function getEngineState() {
  return engineState;
}

export function saveEngineState(newState) {
  engineState = { ...engineState, ...newState };
  return engineState;
}

// === Logs ===
export function addEngineLog(message) {
  engineState.logs.push({
    timestamp: new Date().toISOString(),
    message
  });
}

// === Erreurs ===
export function addEngineError(error) {
  engineState.errors.push({
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error)
  });
}

// === Alertes ===
export function setAlerts(alerts) {
  engineState.alertsList = alerts;
  return engineState.alertsList;
}

// === Reset (si besoin) ===
export function resetEngineState() {
  engineState = {
    runTime: null,
    zonesCovered: {},
    sources: {},
    logs: [],
    errors: [],
    alertsList: []
  };
}

// === Export par défaut (robuste pour server.js) ===
export default {
  getEngineState,
  saveEngineState,
  addEngineLog,
  addEngineError,
  setAlerts,
  resetEngineState
};
