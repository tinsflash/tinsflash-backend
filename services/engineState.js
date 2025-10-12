// ==========================================================
// 🧠 TINSFLASH – engineState.js (Everest Protocol v4.3.1-REAL)
// ==========================================================
// ✅ Gestion complète de l’état du moteur IA
// ✅ Logs, erreurs, statut et mémoire centrale
// ✅ Strictement compatible avec les imports existants
// ==========================================================

import mongoose from "mongoose";

// ==========================================================
// 🧱 Définition des schémas
// ==========================================================

const ErrorSchema = new mongoose.Schema({
  level: { type: String, default: "error" },
  module: { type: String, default: "core" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const LogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ["info", "warning", "error", "success"],
    default: "info",
  },
  module: { type: String, default: "core" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle | running | ok | fail
  lastRun: { type: Date, default: null },
  memoryUsageMB: { type: Number, default: 0 },
  checkup: { type: Object, default: {} },
  logs: [LogSchema],
  errors: [ErrorSchema],
});

// ==========================================================
// ⚙️ Modèle principal
// ==========================================================
export const EngineState =
  mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

// ==========================================================
// 🧩 Fonctions principales (conformes à tes imports)
// ==========================================================

// 🟢 Ajout de log standard
export async function addEngineLog(message, level = "info", module = "core") {
  try {
    const log = { message, level, module, timestamp: new Date() };
    await EngineState.updateOne(
      {},
      { $push: { logs: log }, $set: { lastRun: new Date() } },
      { upsert: true }
    );
    console.log(`🛰️ [${level.toUpperCase()}][${module}] ${message}`);
  } catch (err) {
    console.error("❌ Erreur addEngineLog:", err.message);
  }
}

// 🔴 Ajout d’erreur critique
export async function addEngineError(message, module = "core") {
  try {
    const error = { message, level: "error", module, timestamp: new Date() };
    await EngineState.updateOne(
      {},
      { $push: { errors: error }, $set: { status: "fail" } },
      { upsert: true }
    );
    console.error(`💥 [ERREUR][${module}] ${message}`);
  } catch (err) {
    console.error("❌ Erreur addEngineError:", err.message);
  }
}

// 🧠 Sauvegarde / mise à jour de l’état complet (nom historique)
export async function saveEngineState(newState = {}) {
  try {
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    await EngineState.updateOne(
      {},
      {
        $set: {
          ...newState,
          memoryUsageMB: memoryMB,
          lastRun: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`💾 État du moteur sauvegardé (${memoryMB} MB)`);
  } catch (err) {
    console.error("❌ Erreur saveEngineState:", err.message);
  }
}

// ==========================================================
// 🚦 Exports (inchangés, 100 % rétro-compatibles)
// ==========================================================
export default {
  addEngineLog,
  addEngineError,
  saveEngineState,
};
