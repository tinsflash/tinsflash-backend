import mongoose from "mongoose";

const ErrorSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const LogSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" },
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  errors: { type: [ErrorSchema], default: [] },
  logs: { type: [LogSchema], default: [] },
  currentCycleId: { type: String, default: null },
});

const EngineState = mongoose.model("EngineState", EngineStateSchema);

/* -------------------- LOGS -------------------- */
export async function addEngineLog(message) {
  let s = await EngineState.findOne();
  if (!s) s = new EngineState();
  s.logs.unshift({ message, timestamp: new Date() });
  if (s.logs.length > 200) s.logs.pop();
  await s.save();
  return { timestamp: Date.now(), message };
}

export async function addEngineError(message) {
  let s = await EngineState.findOne();
  if (!s) s = new EngineState();
  s.errors.unshift({ message, timestamp: new Date() });
  if (s.errors.length > 200) s.errors.pop();
  await s.save();
  return { timestamp: Date.now(), message };
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
  // ✅ Cas 1 : document Mongoose
  if (typeof state.save === "function") {
    return await state.save();
  }

  // ✅ Cas 2 : objet brut (fallback)
  const existing = await EngineState.findOne();
  if (existing) {
    await EngineState.updateOne({ _id: existing._id }, { $set: state });
    return await EngineState.findById(existing._id);
  } else {
    const s = new EngineState(state);
    await s.save();
    return s;
  }
}

/* -------------------- EXPORT PAR DEFAUT -------------------- */
export default EngineState;
