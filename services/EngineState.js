// PATH: services/engineState.js
// ⚙️ Gestion de l’état global du moteur TINSFLASH PRO+++
// Version : Everest Protocol v3.1 — 100 % réel & connecté

import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
  module: { type: String, required: true },
  level: { type: String, enum: ["info", "warn", "error"], default: "info" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle | running | ok | fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
});

export const EngineState = mongoose.model("EngineState", EngineStateSchema);
export const EngineLog = mongoose.model("EngineLog", LogSchema);

// ==========================================================
// 🔧 Fonctions utilitaires — Logs & statut moteur
// ==========================================================

export async function addEngineLog(message, level = "info", module = "core") {
  try {
    const log = new EngineLog({ message, level, module });
    await log.save();
    console.log(`🛰️ [${level.toUpperCase()}][${module}] ${message}`);
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement du log:", err);
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
    console.error("❌ Erreur mise à jour EngineState:", err);
  }
}

export async function getEngineState() {
  try {
    const state = await EngineState.findOne({});
    return state || { status: "idle", lastRun: null };
  } catch (err) {
    console.error("❌ Erreur lecture EngineState:", err);
    return { status: "fail", lastRun: null };
  }
}

export default { addEngineLog, updateEngineState, getEngineState };
