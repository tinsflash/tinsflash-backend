// ==========================================================
// services/engineState.js
// État moteur + journalisation + flux SSE admin
// ==========================================================
import mongoose from "mongoose";
import EventEmitter from "events";

export const engineEvents = new EventEmitter();

const ErrorSchema = new mongoose.Schema({
  level: { type: String, default: "error" },
  module: { type: String, default: "core" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const LogSchema = new mongoose.Schema({
  level: { type: String, default: "info" },
  module: { type: String, default: "core" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle, running, ok, fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  logs: [LogSchema],
  errors: [ErrorSchema],
});

export const EngineState = mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

let STOP_FLAG = false;

export async function initEngineState() {
  const count = await EngineState.countDocuments();
  if (count === 0) {
    await new EngineState({ status: "idle" }).save();
    console.log("✅ EngineState initialisé");
  }
}

export async function getEngineState() {
  const s = await EngineState.findOne();
  return s || new EngineState({ status: "idle" });
}

export async function saveEngineState(state) {
  await state.save();
}

export async function addEngineLog(message, level = "info", module = "core") {
  const s = await getEngineState();
  s.logs.push({ message, level, module });
  if (s.logs.length > 500) s.logs.shift();
  await s.save();
  engineEvents.emit("log", { type: "log", message, level, module, time: new Date() });
  console.log(`[${module}] ${level.toUpperCase()}: ${message}`);
}

export async function addEngineError(message, module = "core") {
  const s = await getEngineState();
  s.errors.push({ message, module, level: "error" });
  if (s.errors.length > 200) s.errors.shift();
  await s.save();
  engineEvents.emit("log", { type: "error", message, module, time: new Date() });
  console.error(`[${module}] ❌ ERROR: ${message}`);
}

export function stopExtraction() {
  STOP_FLAG = true;
}

export function resetStopFlag() {
  STOP_FLAG = false;
}

export function isExtractionStopped() {
  return STOP_FLAG;
}
