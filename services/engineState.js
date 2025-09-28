// services/engineState.js

let engineState = {
  runTime: null,
  zonesCovered: {},
  sources: [],
  alertsList: [],
  errors: [],
  logs: [],
  checkup: {
    models: "PENDING",             // 🟠 en attente
    sources: "PENDING",
    aiForecast: "PENDING",
    aiAlerts: "PENDING",
    localForecasts: "PENDING",
    nationalForecasts: "PENDING",
    localAlerts: "PENDING",
    nationalAlerts: "PENDING",
    continentalAlerts: "PENDING",
    globalAlerts: "PENDING",
    openDataFallback: "PENDING",
    engineStatus: "PENDING"
  }
};

// === Exports (inchangés) ===
export function getEngineState() { return engineState; }
export function saveEngineState(newState) { engineState = newState; }
export function addEngineLog(msg) {
  engineState.logs.push({ ts: new Date().toISOString(), msg });
}
export function addEngineError(err) {
  engineState.errors.push({ ts: new Date().toISOString(), error: err });
}
