// ==========================================================
// 🧠 TINSFLASH – engineState.js (v4.3.1 REAL)
// ==========================================================
import mongoose from "mongoose";

// =====================
// 🔧 Schemas internes
// =====================
const ErrorSchema = new mongoose.Schema({
  level: { type: String, enum: ["info", "warn", "error", "success", "ok"], default: "error" },
  module: { type: String },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const LogSchema = new mongoose.Schema({
  level: { type: String, enum: ["info", "warn", "error", "success", "ok"], default: "info" },
  module: { type: String },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// ⚙️ État moteur
const EngineStateSchema = new mongoose.Schema({
  status: { type: mongoose.Schema.Types.Mixed, default: "idle" },
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  logs: [LogSchema],
  errors: [ErrorSchema],
});

const EngineState = mongoose.model("EngineState", EngineStateSchema);

// =====================
// 🔧 Fonctions utilitaires
// =====================
export async function addEngineLog(message, level = "info", module = "core") {
  try {
    await EngineState.updateOne(
      {},
      { $push: { logs: { message, level, module, timestamp: new Date() } } },
      { upsert: true }
    );
  } catch (e) {
    console.error("Erreur log Engine:", e.message);
  }
}

export async function addEngineError(message, module = "core") {
  try {
    await EngineState.updateOne(
      {},
      { $push: { errors: { message, level: "error", module, timestamp: new Date() } } },
      { upsert: true }
    );
  } catch (e) {
    console.error("Erreur ajout EngineError:", e.message);
  }
}

export async function updateEngineState(status = "ok") {
  try {
    await EngineState.updateOne({}, { status, lastRun: new Date() }, { upsert: true });
  } catch (e) {
    console.error("Erreur updateEngineState:", e.message);
  }
}

export default EngineState;
