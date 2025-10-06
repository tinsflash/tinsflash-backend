// PATH: services/engineState.js
// 🧠 Gestion complète de l’état du moteur TINSFLASH (statut, logs, erreurs, cycles)

import mongoose from "mongoose";
// ⚠️ Import global, ne pas chercher broadcastLog qui n’existe pas
import * as adminLogs from "./adminLogs.js";

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
  errors: { type: [ErrorSchema], default: [] },
  logs: { type: [LogSchema], default: [] },
  currentCycleId: { type: String, default: null },
});

// 🧩 Avant sauvegarde : cohérence minimale
EngineStateSchema.pre("save", function (next) {
  if (!this.checkup) this.checkup = {};
  if (!this.checkup.engineStatus) this.checkup.engineStatus = "IDLE";
  next();
});

// 🧩 Méthodes internes (instance)
EngineStateSchema.methods.addLog = function (msg) {
  this.logs.unshift({ message: msg, timestamp: new Date() });
  if (this.logs.length > 200) this.logs.pop(); // Limite mémoire
};

EngineStateSchema.methods.addError = function (msg) {
  this.errors.unshift({ message: msg, timestamp: new Date() });
  if (this.errors.length > 200) this.errors.pop();
};

// 🧩 Modèle principal
const EngineState = mongoose.model("EngineState", EngineStateSchema);

// === Fonctions publiques ===

// 📜 Ajout log normal
export async function addEngineLog(message) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  state.addLog(message);
  await state.save();

  // ✅ Diffusion en temps réel (SSE)
  try {
    if (adminLogs && typeof adminLogs.addLog === "function") {
      await adminLogs.addLog(message);
    }
  } catch (e) {
    console.warn("⚠️ SSE non diffusé:", e.message);
  }

  return { ts: Date.now(), type: "INFO", message };
}

// ❌ Ajout log erreur
export async function addEngineError(message) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  state.addError(message);
  await state.save();

  // ✅ Diffusion en temps réel
  try {
    if (adminLogs && typeof adminLogs.addError === "function") {
      await adminLogs.addError(message);
    }
  } catch (e) {
    console.warn("⚠️ SSE non diffusé (error):", e.message);
  }

  return { ts: Date.now(), type: "ERROR", message };
}

// 📊 Récupération de l’état complet du moteur
export async function getEngineState() {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState();
    await state.save();
  }
  return state;
}

// 💾 Sauvegarde de l’état complet
export async function saveEngineState(state) {
  return state.save();
}

export default EngineState;
