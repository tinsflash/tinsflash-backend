// services/engineState.js

let engineState = {
  runTime: null,
  zonesCovered: {},
  sources: [],
  alertsList: [],
  errors: [],
  logs: [],
};

// === Fonctions principales ===
export function getEngineState() {
  return engineState;
}

export function saveEngineState(newState) {
  engineState = newState;
}

export function addEngineLog(msg) {
  engineState.logs.push({ ts: new Date().toISOString(), msg });
}

// === ✅ Nouveau export : gestion des erreurs ===
// (sans modifier les exports existants)
export function addEngineError(err) {
  engineState.errors.push({ ts: new Date().toISOString(), error: err });
}
