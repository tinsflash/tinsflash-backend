// PATH: services/engineState.js
// ⚙️ Suivi moteur TINSFLASH – status, logs, erreurs, zones couvertes

import mongoose from "mongoose";
import { enumerateCoveredPoints } from "./zonesCovered.js";

const ErrorSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const LogSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" },
  lastRun: Date,
  checkup: Object,
  partialReport: Object,
  finalReport: Object,
  alertsLocal: Array,
  alertsContinental: Array,
  alertsWorld: Array,
  errors: [ErrorSchema],
  logs: [LogSchema],
});

const EngineState = mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

export async function getEngineState() {
  let s = await EngineState.findOne().sort({ _id: -1 });
  if (!s) {
    s = new EngineState({ status: "idle" });
    await s.save();
  }
  s.checkup = s.checkup || {};
  s.checkup.coveredPoints = enumerateCoveredPoints();
  return s;
}

export async function saveEngineState(updated) {
  if (!updated) return null;
  const s = new EngineState(updated);
  await s.save();
  return s;
}

export async function addEngineLog(message) {
  let s = await EngineState.findOne().sort({ _id: -1 });
  if (!s) s = new EngineState({ status: "idle" });
  s.logs.push({ message });
  if (s.logs.length > 500) s.logs.shift();
  await s.save().catch(err =>
    console.warn("⚠️ EngineState save skipped:", err.message)
  );
}

export async function addEngineError(message) {
  let s = await EngineState.findOne().sort({ _id: -1 });
  if (!s) s = new EngineState({ status: "idle" });
  s.errors.push({ message });
  if (s.errors.length > 200) s.errors.shift();
  await s.save().catch(err =>
    console.warn("⚠️ EngineState save skipped:", err.message)
  );
}

export default { getEngineState, saveEngineState, addEngineLog, addEngineError };
