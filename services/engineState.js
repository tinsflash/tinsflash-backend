// ==========================================================
// ⚙️ TINSFLASH PRO+++ – engineState.js (Everest Protocol v2.7)
// ==========================================================
// Gestion centralisée de l’état du moteur TINSFLASH (logs, erreurs, états)
// Ajout : stop flag, verrou anti-concurrence, compatibilité Render, flux SSE.
// ==========================================================

import mongoose from "mongoose";
import EventEmitter from "events";

// === Émetteur global de logs temps réel ===
export const engineEvents = new EventEmitter();

// === Réglages Mongoose ===
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", false);

// === Schémas ===
const ErrorSchema = new mongoose.Schema({
  level: { type: String, default: "error" },
  module: { type: String, default: "core" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  meta: { type: Object, default: {} },
});

const LogSchema = new mongoose.Schema({
  level: { type: String, default: "info" },
  module: { type: String, default: "core" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  meta: { type: Object, default: {} },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle, running, ok, fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  zonesCovered: { type: Object, default: {} },
  alerts: { type: Object, default: {} },
  errors: [ErrorSchema],
  logs: [LogSchema],
  stopFlag: { type: Boolean, default: false }, // 🛑 Ajouté : indicateur d’arrêt extraction
});

const EngineState =
  mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

let engineCache = null;
let saveInProgress = false;

// ==========================================================
// 🔄 Connexion Mongo + initialisation
// ==========================================================
export async function initEngineState() {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log("✅ MongoDB connecté (engineState)");
    }

    engineCache = await EngineState.findOne();
    if (!engineCache) {
      engineCache = await EngineState.create({
        status: "idle",
        logs: [],
        errors: [],
        stopFlag: false,
      });
      console.log("⚙️ Nouveau document EngineState créé.");
    }
    return engineCache;
  } catch (err) {
    console.error("❌ Erreur initEngineState:", err.message);
  }
}

// ==========================================================
// 🔍 Lecture / sauvegarde d’état
// ==========================================================
export function getEngineState() {
  return engineCache || { status: "idle", logs: [], errors: [], checkup: {}, stopFlag: false };
}

export async function saveEngineState(newState = {}) {
  if (saveInProgress) return;
  saveInProgress = true;
  try {
    if (!engineCache) await initEngineState();
    Object.assign(engineCache, newState);
    await EngineState.updateOne({ _id: engineCache._id }, engineCache, { upsert: true });
  } catch (err) {
    console.warn("⚠️ EngineState save skipped:", err.message);
  } finally {
    saveInProgress = false;
  }
}

// ==========================================================
// 🛑 Stop flag – gestion extraction
// ==========================================================
export function stopExtraction() {
  if (engineCache) engineCache.stopFlag = true;
  engineEvents.emit("log", {
    level: "warn",
    module: "core",
    message: "🛑 Extraction stoppée manuellement",
    timestamp: new Date(),
    color: "\x1b[33m",
  });
}

export function resetStopFlag() {
  if (engineCache) engineCache.stopFlag = false;
  engineEvents.emit("log", {
    level: "info",
    module: "core",
    message: "✅ Flag stop extraction réinitialisé",
    timestamp: new Date(),
    color: "\x1b[36m",
  });
}

export function isExtractionStopped() {
  return engineCache?.stopFlag === true;
}

// ==========================================================
// 🪶 Gestion des logs (niveau + module)
// ==========================================================
export async function addEngineLog(message, level = "info", module = "core", meta = {}) {
  try {
    const log = { level, module, message, timestamp: new Date(), meta };

    // === Couleurs console Render ===
    const color =
      level === "error"
        ? "\x1b[31m"
        : level === "warning" || level === "warn"
        ? "\x1b[33m"
        : level === "success"
        ? "\x1b[32m"
        : "\x1b[36m";

    console.log(`${color}[${level.toUpperCase()}][${module}] ${message}\x1b[0m`);

    engineEvents.emit("log", { ...log, color });

    if (!engineCache) await initEngineState();
    engineCache.logs.push(log);
    if (engineCache.logs.length > 500) engineCache.logs.shift(); // 🔁 limite sécurité mémoire
    await saveEngineState({});
  } catch (err) {
    console.warn("⚠️ addEngineLog erreur:", err.message);
  }
}

// ==========================================================
// ❌ Gestion des erreurs
// ==========================================================
export async function addEngineError(message, module = "core", meta = {}) {
  try {
    const error = {
      level: "error",
      module,
      message,
      timestamp: new Date(),
      meta,
    };

    console.error(`\x1b[31m[ERROR][${module}] ${message}\x1b[0m`);

    engineEvents.emit("log", { ...error, color: "\x1b[31m" });

    if (!engineCache) await initEngineState();
    engineCache.errors.push(error);
    if (engineCache.errors.length > 500) engineCache.errors.shift();
    await saveEngineState({});
  } catch (err) {
    console.warn("⚠️ addEngineError erreur:", err.message);
  }
}
