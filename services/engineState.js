// PATH: services/engineState.js
// ⚙️ Suivi et état du moteur TINSFLASH (status, logs, erreurs, zones couvertes)

import mongoose from "mongoose";
import { enumerateCoveredPoints } from "./zonesCovered.js";

// === Schémas Mongo ===
const ErrorSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const LogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle, running, ok, fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  partialReport: { type: Object, default: null },
  finalReport: { type: Object, default: null },
  alertsLocal: { type: Array, default: [] },
  alertsContinental: { type: Array, default: [] },
  alertsWorld: { type: Array, default: [] },
  errors: [ErrorSchema],
  logs: [LogSchema],
});

const EngineState = mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

// === Fonctions principales ===

export async function getEngineState() {
  let state = await EngineState.findOne().sort({ _id: -1 });
  if (!state) {
    state = new EngineState({ status: "idle" });
    await state.save();
  }

  // Injection des zones couvertes actuelles
  const coveredPoints = enumerateCoveredPoints();
  state.checkup = state.checkup || {};
  state.checkup.coveredPoints = coveredPoints;

  return state;
}

export async function saveEngineState(updated) {
  if (!updated) return null;
  const s = new EngineState(updated);
  await s.save();
  return s;
}

export async function addEngineLog(message) {
  const s = await getEngineState();
  s.logs.push({ message });
  if (s.logs.length > 500) s.logs.shift(); // limite taille
  await s.save();
}

export async function addEngineError(message) {
  const s = await getEngineState();
  s.errors.push({ message });
  if (s.errors.length > 200) s.errors.shift();
  await s.save();
}

export async function clearEngineLogs() {
  const s = await getEngineState();
  s.logs = [];
  await s.save();
}

export default { getEngineState, saveEngineState, addEngineLog, addEngineError, clearEngineLogs };
