// services/engineState.js
import mongoose from "mongoose";

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

// ✅ Préserver un minimum de cohérence
EngineStateSchema.pre("save", function (next) {
  if (!this.checkup) this.checkup = {};
  if (!this.checkup.engineStatus) this.checkup.engineStatus = "IDLE";
  next();
});

// ✅ Méthodes internes (instance)
EngineStateSchema.methods.addLog = function (msg) {
  this.logs.unshift({ message: msg, timestamp: new Date() });
  if (this.logs.length > 200) this.logs.pop(); // limite mémoire
};

EngineStateSchema.methods.addError = function (msg) {
  this.errors.unshift({ message: msg, timestamp: new Date() });
  if (this.errors.length > 200) this.errors.pop();
};

// ✅ Modèle
const EngineState = mongoose.model("EngineState", EngineStateSchema);

// === Helpers exports pour adminLogs.js ===
export async function addEngineLog(message) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  state.addLog(message);
  await state.save();

  return { ts: Date.now(), type: "INFO", message };
}

export async function addEngineError(message) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  state.addError(message);
  await state.save();

  return { ts: Date.now(), type: "ERROR", message };
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
