// PATH: services/engineState.js
// 🔩 Gestion de l’état du moteur et des logs – version complète & connectée SSE + Render

import mongoose from "mongoose";
import { broadcastLog } from "./adminLogs.js"; // ⬅️ liaison SSE

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
  alertsLocal: { type: Array, default: [] },
  forecastsContinental: { type: Object, default: {} },
  finalReport: { type: Object, default: {} },
});

// ✅ Préserve la cohérence de l’état
EngineStateSchema.pre("save", function (next) {
  if (!this.checkup) this.checkup = {};
  if (!this.checkup.engineStatus) this.checkup.engineStatus = "IDLE";
  next();
});

const EngineState = mongoose.model("EngineState", EngineStateSchema);

// === Enregistrement des logs + sortie console + diffusion SSE ===
export async function addEngineLog(message) {
  try {
    let state = await EngineState.findOne();
    if (!state) state = new EngineState();

    state.logs.unshift({ message, timestamp: new Date() });
    if (state.logs.length > 200) state.logs.pop();
    await state.save();

    // Affiche dans Render
    console.log("🛰️ LOG:", message);

    // Diffuse SSE
    if (typeof broadcastLog === "function") broadcastLog({ message, timestamp: new Date() });

    return { ts: Date.now(), type: "INFO", message };
  } catch (err) {
    console.error("⚠️ Erreur addEngineLog:", err.message);
  }
}

export async function addEngineError(message) {
  try {
    let state = await EngineState.findOne();
    if (!state) state = new EngineState();

    state.errors.unshift({ message, timestamp: new Date() });
    if (state.errors.length > 200) state.errors.pop();
    await state.save();

    console.error("❌ ERREUR:", message);

    if (typeof broadcastLog === "function")
      broadcastLog({ message: "❌ " + message, timestamp: new Date() });

    return { ts: Date.now(), type: "ERROR", message };
  } catch (err) {
    console.error("⚠️ Erreur addEngineError:", err.message);
  }
}

export async function getEngineState() {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState();
    await state.save();
  }
  return state;
}

export async function saveEngineState(state) {
  return state.save();
}

export default EngineState;
