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

  checkup: {
    type: Object,
    default: {
      models: {
        ECMWF: "pending",
        GFS: "pending",
        ICON: "pending",
        Meteomatics: "pending",
        Copernicus: "pending",
        NASA: "pending",
        OpenWeather: "pending",
      },
      steps: {
        superForecast: "pending",
        alertsCovered: "pending",
        alertsContinental: "pending",
        fusionIA: "pending",
        deploy: "pending",
      },
      zonesCovered: 0,
      engineStatus: "IDLE",
    },
  },

  engineErrors: { type: [ErrorSchema], default: [] }, // ✅ renommé
  logs: { type: [LogSchema], default: [] },
  currentCycleId: { type: String, default: null },
});

// ✅ Middleware cohérence
EngineStateSchema.pre("save", function (next) {
  if (!this.checkup) this.checkup = {};
  if (!this.checkup.engineStatus) this.checkup.engineStatus = "IDLE";
  if (!this.checkup.models) {
    this.checkup.models = {
      ECMWF: "pending",
      GFS: "pending",
      ICON: "pending",
      Meteomatics: "pending",
      Copernicus: "pending",
      NASA: "pending",
      OpenWeather: "pending",
    };
  }
  if (!this.checkup.steps) {
    this.checkup.steps = {
      superForecast: "pending",
      alertsCovered: "pending",
      alertsContinental: "pending",
      fusionIA: "pending",
      deploy: "pending",
    };
  }
  if (!this.checkup.zonesCovered) this.checkup.zonesCovered = 0;
  next();
});

// === Modèle
const EngineState = mongoose.model("EngineState", EngineStateSchema);

// === Fonctions utilitaires ===

// Ajoute un log (atomique, pas de conflit)
export async function addEngineLog(message) {
  const entry = { message, timestamp: new Date() };
  await EngineState.findOneAndUpdate(
    {},
    { $push: { logs: { $each: [entry], $position: 0 } }, $slice: { logs: 200 } },
    { new: true, upsert: true }
  );
  return { ts: Date.now(), type: "INFO", message };
}

// Ajoute une erreur (atomique)
export async function addEngineError(message) {
  const entry = { message, timestamp: new Date() };
  await EngineState.findOneAndUpdate(
    {},
    { $push: { engineErrors: { $each: [entry], $position: 0 } }, $slice: { engineErrors: 200 } },
    { new: true, upsert: true }
  );
  return { ts: Date.now(), type: "ERROR", message };
}

// Récupère l’état moteur
export async function getEngineState() {
  let state = await EngineState.findOne();
  if (!state) {
    state = new EngineState();
    await state.save();
  }
  return state;
}

// Sauvegarde atomique (merge)
export async function saveEngineState(state) {
  return await EngineState.findOneAndUpdate(
    {},
    state.toObject(),
    { new: true, upsert: true }
  );
}

// Met à jour un champ précis
export async function updateEngineState(path, value) {
  const update = {};
  update[path] = value;
  return await EngineState.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
}

export default EngineState;
