// services/engineState.js
// ⚙️ Gestion centralisée de l’état du moteur TINSFLASH (logs, erreurs, états)

import mongoose from "mongoose";

// Empêche le buffering quand la DB tarde à répondre
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

// === Modèle principal ===
const EngineState = mongoose.models.EngineState || mongoose.model("EngineState", EngineStateSchema);

let engineCache = null;

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

export async function saveEngineState(newState) {
  try {
    if (!engineCache) await initEngineState();
    Object.assign(engineCache, newState);
    await engineCache.save();
  } catch (err) {
    console.warn("⚠️ EngineState save skipped:", err.message);
  }
}

// =====================================
// 🪶 Logs et erreurs
// =====================================
export function addEngineLog(message) {
  const log = { message, timestamp: new Date() };
  console.log("[LOG]", message);
  if (engineCache) {
    engineCache.logs.push(log);
    engineCache.save().catch(() => {});
  }
}

export function addEngineError(message) {
  const error = { message, timestamp: new Date() };
  console.error("[ERROR]", message);
  if (engineCache) {
    engineCache.errors.push(error);
    engineCache.save().catch(() => {});
  }
}
