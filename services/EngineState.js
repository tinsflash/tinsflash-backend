// ==========================================================
// 🧠 TINSFLASH – engineState.js (Everest Protocol v4.3.1-REAL+)
// ==========================================================
// ✅ Gestion complète de l’état du moteur IA J.E.A.N.
// ✅ Logs, erreurs, statut et mémoire centrale
// ✅ Structure 100 % rétrocompatible (saveEngineState / getEngineState)
// ==========================================================

import mongoose from "mongoose";

// ==========================================================
// 🧱 Schémas
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
// 🟢 Ajout de log standard
// ==========================================================
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

// ==========================================================
// 🔴 Ajout d’erreur critique
// ==========================================================
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

// ==========================================================
// 💾 Sauvegarde / mise à jour complète (nom historique conservé)
// ==========================================================
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
// 🔍 Lecture complète de l’état (fonction historique demandée)
// ==========================================================
export async function getEngineState() {
  try {
    const state = await EngineState.findOne({});
    return state || {};
  } catch (err) {
    console.error("❌ Erreur getEngineState:", err.message);
    return {};
  }
}

// ==========================================================
// 🚦 Exports inchangés – 100 % rétrocompatibles
// ==========================================================
export default {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
};
