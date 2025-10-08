// services/engineState.js
// ⚙️ Gestion centralisée de l’état du moteur TINSFLASH (logs, erreurs, états)

import mongoose from "mongoose";

mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", false);

// === Schémas ===
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
  zonesCovered: { type: Object, default: {} },
  alerts: { type: Object, default: {} },
  errors: [ErrorSchema],
  logs: [LogSchema],
});

const EngineState = mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

let engineCache = null;
let saveInProgress = false; // 🔒 verrou asynchrone

// =====================================
// 🔄 Connexion Mongo + état mémoire local
// =====================================
export async function initEngineState() {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log("✅ MongoDB connecté (engineState)");
    }

    engineCache = await EngineState.findOne();
    if (!engineCache) {
      engineCache = await EngineState.create({ status: "idle", logs: [], errors: [] });
      console.log("⚙️ Nouveau document EngineState créé.");
    }
    return engineCache;
  } catch (err) {
    console.error("❌ Erreur initEngineState:", err.message);
  }
}

// =====================================
// 🔍 Récupérer / sauvegarder l’état
// =====================================
export function getEngineState() {
  return engineCache || { status: "idle", logs: [], errors: [], checkup: {} };
}

export async function saveEngineState(newState = {}) {
  if (saveInProgress) return; // 🔁 évite les appels simultanés
  saveInProgress = true;

  try {
    if (!engineCache) await initEngineState();
    Object.assign(engineCache, newState);
    await engineCache.save();
  } catch (err) {
    console.warn("⚠️ EngineState save skipped:", err.message);
  } finally {
    saveInProgress = false;
  }
}

// =====================================
// 🪶 Logs et erreurs
// =====================================
export async function addEngineLog(message) {
  try {
    const log = { message, timestamp: new Date() };
    console.log("[LOG]", message);
    if (!engineCache) await initEngineState();
    engineCache.logs.push(log);
    await saveEngineState({});
  } catch (err) {
    console.warn("⚠️ addEngineLog erreur:", err.message);
  }
}

export async function addEngineError(message) {
  try {
    const error = { message, timestamp: new Date() };
    console.error("[ERROR]", message);
    if (!engineCache) await initEngineState();
    engineCache.errors.push(error);
    await saveEngineState({});
  } catch (err) {
    console.warn("⚠️ addEngineError erreur:", err.message);
  }
}
