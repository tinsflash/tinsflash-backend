// PATH: services/engineState.js
// 🧠 Gestion centrale de l’état moteur TINSFLASH (status, logs, erreurs, checkup)

import mongoose from "mongoose";

/* -------------------- SCHÉMAS -------------------- */
const ErrorSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const LogSchema = new mongoose.Schema({
  message: String,
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

const EngineState = mongoose.model("EngineState", EngineStateSchema);

/* -------------------- LOGS -------------------- */
export async function addEngineLog(message) {
  try {
    let s = await EngineState.findOne();
    if (!s) s = new EngineState();
    s.logs.unshift({ message, timestamp: new Date() });
    if (s.logs.length > 200) s.logs.pop();
    await s.save();
    return { timestamp: Date.now(), message };
  } catch (err) {
    console.error("❌ addEngineLog error:", err.message);
  }
}

export async function addEngineError(message) {
  try {
    let s = await EngineState.findOne();
    if (!s) s = new EngineState();
    s.errors.unshift({ message, timestamp: new Date() });
    if (s.errors.length > 200) s.errors.pop();
    await s.save();
    return { timestamp: Date.now(), message };
  } catch (err) {
    console.error("❌ addEngineError error:", err.message);
  }
}

/* -------------------- ETAT -------------------- */
export async function getEngineState() {
  let s = await EngineState.findOne();
  if (!s) {
    s = new EngineState();
    await s.save();
  }
  return s;
}

/* -------------------- SAUVEGARDE INTELLIGENTE -------------------- */
export async function saveEngineState(state) {
  try {
    // ✅ Cas 1 : document Mongoose (existant)
    if (state && typeof state.save === "function") {
      return await state.save();
    }

    // ✅ Cas 2 : objet brut → mise à jour ou création
    const existing = await EngineState.findOne();
    if (existing) {
      await EngineState.updateOne({ _id: existing._id }, { $set: state });
      return await EngineState.findById(existing._id);
    } else {
      const s = new EngineState(state);
      await s.save();
      return s;
    }
  } catch (err) {
    console.error("❌ saveEngineState error:", err.message);
    throw err;
  }
}

/* -------------------- EXPORT PAR DÉFAUT -------------------- */
export default EngineState;
