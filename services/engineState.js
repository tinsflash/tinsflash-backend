// ==========================================================
// ⚙️ Gestion de l’état global du moteur TINSFLASH PRO+++
// Version : Everest Protocol v3.95 — 100 % réel, connecté et Render-compatible
// ==========================================================

import mongoose from "mongoose";
import EventEmitter from "events";

// ==========================================================
// 🧩 Schémas MongoDB
// ==========================================================
const LogSchema = new mongoose.Schema({
  module: { type: String, required: true },
  level: { type: String, enum: ["info", "warn", "error", "success"], default: "info" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle | running | ok | fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  errors: { type: Array, default: [] },
  alertsWorld: { type: Object, default: {} },
});

export const EngineState = mongoose.model("EngineState", EngineStateSchema);
export const EngineLog = mongoose.model("EngineLog", LogSchema);

// ==========================================================
// 🔊 Event Emitter global (pour logs SSE temps réel)
// ==========================================================
export const engineEvents = new EventEmitter();

// Cette fonction externe permet de synchroniser les logs avec le flux SSE (/api/logs)
let externalLogStream = null;
export function bindExternalLogStream(fn) {
  externalLogStream = fn;
}

// ==========================================================
// 🔧 Fonctions utilitaires — Logs, erreurs & statut moteur
// ==========================================================
export async function addEngineLog(message, level = "info", module = "core") {
  try {
    const log = new EngineLog({ message, level, module });
    await log.save();
    const payload = { message, level, module, timestamp: new Date() };
    console.log(`🛰️ [${level.toUpperCase()}][${module}] ${message}`);
    engineEvents.emit("log", payload);
    if (externalLogStream) externalLogStream(`[${module}] ${message}`);
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement du log:", err.message);
  }
}

export async function addEngineError(message, module = "core") {
  try {
    const log = new EngineLog({ message, level: "error", module });
    await log.save();
    const payload = { message, level: "error", module, timestamp: new Date() };
    console.error(`💥 [ERREUR][${module}] ${message}`);
    engineEvents.emit("log", payload);
    if (externalLogStream) externalLogStream(`❌ [${module}] ${message}`);
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement de l'erreur:", err.message);
  }
}

// ==========================================================
// 🔁 Gestion de l’état moteur
// ==========================================================
export async function saveEngineState(data) {
  try {
    const state = await EngineState.findOneAndUpdate({}, data, { new: true, upsert: true });
    return state;
  } catch (err) {
    await addEngineError(`Erreur saveEngineState: ${err.message}`, "core");
  }
}

export async function updateEngineState(status, checkup = {}) {
  try {
    const state = await EngineState.findOneAndUpdate(
      {},
      { status, lastRun: new Date(), checkup },
      { new: true, upsert: true }
    );
    await addEngineLog(`État moteur mis à jour : ${status}`, "info", "core");
    return state;
  } catch (err) {
    await addEngineError(`Erreur updateEngineState: ${err.message}`, "core");
  }
}

export async function getEngineState() {
  try {
    const state = await EngineState.findOne({});
    return state || { status: "idle", lastRun: null, checkup: {} };
  } catch (err) {
    await addEngineError(`Erreur getEngineState: ${err.message}`, "core");
    return { status: "fail", lastRun: null };
  }
}

// ==========================================================
// 🛑 Gestion du drapeau d’arrêt manuel de l’extraction
// ==========================================================
let extractionStopped = false;

export function stopExtraction() {
  extractionStopped = true;
  const msg = "🛑 Extraction stoppée manuellement";
  console.warn(msg);
  engineEvents.emit("log", { message: msg, level: "warn", module: "core", timestamp: new Date() });
  if (externalLogStream) externalLogStream(msg);
}

export function resetStopFlag() {
  extractionStopped = false;
  const msg = "✅ Flag stop extraction réinitialisé";
  console.log(msg);
  engineEvents.emit("log", { message: msg, level: "info", module: "core", timestamp: new Date() });
  if (externalLogStream) externalLogStream(msg);
}

export function isExtractionStopped() {
  return extractionStopped;
}

// ==========================================================
// 🧠 Initialisation moteur
// ==========================================================
export async function initEngineState() {
  const existing = await EngineState.findOne({});
  if (!existing) {
    await EngineState.create({
      status: "idle",
      lastRun: null,
      checkup: { engineStatus: "init" },
    });
    await addEngineLog("💡 État moteur initialisé", "info", "core");
  }
  await addEngineLog("🔋 Initialisation moteur TINSFLASH terminée", "info", "core");
}

// ==========================================================
// 📤 Exports
// ==========================================================
export default {
  addEngineLog,
  addEngineError,
  updateEngineState,
  saveEngineState,
  getEngineState,
  stopExtraction,
  resetStopFlag,
  isExtractionStopped,
  initEngineState,
  EngineState,
  EngineLog,
  engineEvents,
  bindExternalLogStream,
};
