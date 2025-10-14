// ==========================================================
// 🧠 TINSFLASH – engineState.js (Everest Protocol v5.2 PRO+++)
// ==========================================================
// Gestion centralisée de l’état du moteur, des logs et des erreurs
// ==========================================================

import mongoose from "mongoose";

// ----------------------------------------------------------
// 🗒️ Schéma des erreurs
const ErrorSchema = new mongoose.Schema({
  message: { type: String, required: true },
  module: { type: String, default: "core" },
  timestamp: { type: Date, default: Date.now },
});

// ----------------------------------------------------------
// 🧾 Schéma des logs du moteur
const LogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  module: { type: String, default: "core" },
  // ✅ Enum enrichi pour supporter tous les types de logs (évite le bug “event non reconnu”)
  level: {
    type: String,
    enum: ["info", "warn", "warning", "error", "success", "event", "system", "debug"],
    default: "info",
  },
  timestamp: { type: Date, default: Date.now },
});

// ----------------------------------------------------------
// ⚙️ Schéma principal : état du moteur TINSFLASH
const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle, running, ok, fail
  lastRun: { type: Date, default: null },
  engineStatus: { type: String, default: "IDLE" }, // IDLE, RUN_OK, FAIL, etc.
  lastFilter: { type: String, default: null }, // dernier filtre ou région exécutée
  zonesCount: { type: Number, default: 0 },
  lastPhase: { type: String, default: "phase1" }, // phase actuelle ou dernière terminée
  checkup: { type: Object, default: {} },
  logs: { type: [LogSchema], default: [] },
  errors: { type: [ErrorSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

// ----------------------------------------------------------
// 📡 Création du modèle principal
export const EngineState =
  mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

// ==========================================================
// 🧩 FONCTIONS DE GESTION DU MOTEUR
// ==========================================================

// 📝 Ajouter un log moteur
export async function addEngineLog(message, level = "info", module = "core") {
  try {
    const state = await EngineState.findOne() || new EngineState();
    state.logs.push({ message, level, module });
    state.updatedAt = new Date();
    await state.save();
    console.log(`[LOG] ${level.toUpperCase()} – ${module}: ${message}`);
  } catch (err) {
    console.error("Erreur addEngineLog:", err.message);
  }
}

// ⚠️ Ajouter une erreur moteur
export async function addEngineError(message, module = "core") {
  try {
    const state = await EngineState.findOne() || new EngineState();
    state.errors.push({ message, module });
    state.status = "fail";
    state.engineStatus = "FAIL";
    state.updatedAt = new Date();
    await state.save();
    console.error(`[ERR] ${module}: ${message}`);
  } catch (err) {
    console.error("Erreur addEngineError:", err.message);
  }
}

// 🚀 Mise à jour du statut global
export async function updateEngineState(status = "ok", extra = {}) {
  try {
    const state = await EngineState.findOne() || new EngineState();
    state.status = status;
    state.engineStatus = extra.engineStatus || state.engineStatus;
    state.lastRun = new Date();
    state.lastFilter = extra.lastFilter || state.lastFilter;
    state.zonesCount = extra.zonesCount || state.zonesCount;
    state.lastPhase = extra.lastPhase || state.lastPhase;
    state.checkup = { ...state.checkup, ...extra };
    state.updatedAt = new Date();
    await state.save();
    console.log(`[STATE] Moteur ${status.toUpperCase()} – zones: ${state.zonesCount}`);
  } catch (err) {
    console.error("Erreur updateEngineState:", err.message);
  }
}

// 🧹 Purge automatique des anciens logs/erreurs (optionnel)
export async function cleanupOldEngineData(hours = 72) {
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const state = await EngineState.findOne();
    if (!state) return;
    state.logs = state.logs.filter((log) => log.timestamp > cutoff);
    state.errors = state.errors.filter((err) => err.timestamp > cutoff);
    await state.save();
    console.log(`[CLEANUP] Logs/erreurs > ${hours}h purgés.`);
  } catch (err) {
    console.error("Erreur cleanupOldEngineData:", err.message);
  }
}

// ==========================================================
// ✅ EXPORTS FINAUX
// ==========================================================
export default {
  EngineState,
  addEngineLog,
  addEngineError,
  updateEngineState,
  cleanupOldEngineData,
};
