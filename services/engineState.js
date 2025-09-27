// services/engineState.js
import { getLogs } from "./adminLogs.js";

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

export function addEngineLog(message) {
  engineState.logs.unshift({ timestamp: new Date().toISOString(), type: "log", message });
  if (engineState.logs.length > 200) engineState.logs = engineState.logs.slice(0, 200);
}

export function addEngineError(message) {
  engineState.errors.unshift({ timestamp: new Date().toISOString(), type: "error", message });
  if (engineState.errors.length > 200) engineState.errors = engineState.errors.slice(0, 200);
}

export function saveEngineState(newState) {
  engineState = { ...engineState, ...newState };
}

export function getEngineState() {
  return { ...engineState, recentLogs: getLogs().slice(0, 10) };
}
