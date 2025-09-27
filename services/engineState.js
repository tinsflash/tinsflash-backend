// services/engineState.js

let engineState = {
  ia: false,
  radar: false,
  forecasts: false,
  alerts: false,
  runTime: null,
  zonesCovered: {},
  zonesContinental: {},
  sources: {},
  alertsList: [],
  errors: [],
  logs: []
};

export function getEngineState() {
  return engineState;
}

export function saveEngineState(newState) {
  engineState = { ...engineState, ...newState };
}

export function addEngineLog(message, type = "log") {
  engineState.logs.push({
    timestamp: new Date().toISOString(),
    type,
    message
  });
}

// === Helpers pour mettre les flags à jour ===
export function markIA(ok = true) {
  engineState.ia = ok;
}
export function markForecasts(ok = true) {
  engineState.forecasts = ok;
}
export function markAlerts(ok = true) {
  engineState.alerts = ok;
}
export function markRadar(ok = true) {
  engineState.radar = ok;
}
