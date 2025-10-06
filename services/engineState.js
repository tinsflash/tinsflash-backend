// PATH: services/engineState.js
// 🧠 Suivi d'état du moteur TINSFLASH (vérifié – stable Render)

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
  forecastsContinental: { type: Object, default: {} },
  alertsLocal: { type: Array, default: [] },
  alertsWorld: { type: Array, default: [] },
  finalReport: { type: Object, default: {} },
});

// ✅ Maintenir cohérence minimale
EngineStateSchema.pre("save", function (next) {
  if (!this.checkup) this.checkup = {};
  if (!this.checkup.engineStatus) this.checkup.engineStatus = "IDLE";
  next();
});

// ✅ Méthodes internes
EngineStateSchema.methods.addLog = function (msg) {
  this.logs.unshift({ message: msg, timestamp: new Date() });
  if (this.logs.length > 500) this.logs.pop(); // on garde 500 max
};

EngineStateSchema.methods.addError = function (msg) {
  this.errors.unshift({ message: msg, timestamp: new Date() });
  if (this.errors.length > 500) this.errors.pop();
};

// === Modèle principal ===
const EngineState = mongoose.model("EngineState", EngineStateSchema);

// === Fonctions utilitaires exportées ===

/** 🔵 Ajouter un log moteur */
export async function addEngineLog(message) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  state.addLog(message);
  await state.save();

  console.log("🛰️ LOG:", message);
  return { ts: Date.now(), type: "INFO", message };
}

/** 🔴 Ajouter une erreur moteur */
export async function addEngineError(message) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  state.addError(message);
  await state.save();

  console.error("⚠️ ERREUR:", message);
  return { ts: Date.now(), type: "ERROR", message };
}

/** 📖 Récupérer l'état du moteur */
export async function getEngineState() {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState();
    await state.save();
  }
  return state;
}

/** 💾 Sauvegarder l'état du moteur */
export async function saveEngineState(state) {
  return state.save();
}

/** 🧩 Mettre à jour une clé spécifique (utilisé par superForecast) */
export async function updateEngineState(keyPath, value) {
  let state = await EngineState.findOne();
  if (!state) state = new EngineState();

  const keys = keyPath.split(".");
  let obj = state;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!obj[k]) obj[k] = {};
    obj = obj[k];
  }
  obj[keys[keys.length - 1]] = value;

  await state.save();
  return true;
}

export default EngineState;
