// ==========================================================
// ⚙️ Gestion de l’état global du moteur TINSFLASH PRO+++
// Version : Everest Protocol v4.3 — REAL GLOBAL CONNECT (Mongo Auto-Ready + Retry + Enum Étendu)
// 100 % réel, connecté et Render-compatible
// ==========================================================

import mongoose from "mongoose";
import EventEmitter from "events";

// ==========================================================
// 🧩 Schémas MongoDB
// ==========================================================
const LogSchema = new mongoose.Schema({
  module: { type: String, required: true },
  level: {
    type: String,
    enum: ["info", "warn", "warning", "error", "success", "server"], // ➕ ajout de "server"
    default: "info",
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const EngineStateSchema = new mongoose.Schema({
  status: { type: String, default: "idle" }, // idle | running | ok | fail
  lastRun: { type: Date, default: null },
  checkup: { type: Object, default: {} },
  errorList: { type: Array, default: [] },
  alertsWorld: { type: Object, default: {} },
  lastExtraction: { type: Object, default: {} },
  extractionHistory: { type: Array, default: [] },
});

export const EngineState = mongoose.model("EngineState", EngineStateSchema);
export const EngineLog = mongoose.model("EngineLog", LogSchema);

// ==========================================================
// 🔊 Event Emitter global (pour logs SSE temps réel)
// ==========================================================
export const engineEvents = new EventEmitter();
let externalLogStream = null;
export function bindExternalLogStream(fn) {
  externalLogStream = fn;
}

// ==========================================================
// 🔧 Utilitaires – Logs, Erreurs & Statut Moteur
// ==========================================================
async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureMongoReady() {
  let tries = 0;
  while (mongoose.connection.readyState !== 1 && tries < 3) {
    console.warn("⏳ En attente de connexion Mongo (retry " + (tries + 1) + ")");
    await wait(1000);
    tries++;
  }
  if (mongoose.connection.readyState !== 1) {
    console.error("❌ Mongo non connecté après 3 tentatives");
    return false;
  }
  return true;
}

export async function addEngineLog(message, level = "info", module = "core") {
  try {
    if (!(await ensureMongoReady())) return;
    const log = new EngineLog({ message, level, module });
    await log.save();
    const payload = { message, level, module, timestamp: new Date() };
    console.log(`🛰️ [${level.toUpperCase()}][${module}] ${message}`);
    engineEvents.emit("log", payload);
    try {
      if (externalLogStream) externalLogStream(`[${module}] ${message}`);
    } catch (e) {
      console.warn("⚠️ externalLogStream error:", e.message);
    }
  } catch (err) {
    console.error("❌ Erreur log:", err.message);
  }
}

export async function addEngineError(message, module = "core") {
  try {
    if (!(await ensureMongoReady())) return;
    const log = new EngineLog({ message, level: "error", module });
    await log.save();
    const payload = { message, level: "error", module, timestamp: new Date() };
    console.error(`💥 [ERREUR][${module}] ${message}`);
    engineEvents.emit("log", payload);
    try {
      if (externalLogStream) externalLogStream(`❌ [${module}] ${message}`);
    } catch (e) {
      console.warn("⚠️ externalLogStream error:", e.message);
    }
  } catch (err) {
    console.error("❌ Erreur enregistrement erreur:", err.message);
  }
}

// ==========================================================
// 🔁 Gestion de l’état moteur
// ==========================================================
export async function saveEngineState(data) {
  try {
    if (!(await ensureMongoReady())) return;
    const state = await EngineState.findOneAndUpdate({}, data, { new: true, upsert: true });
    return state;
  } catch (err) {
    await addEngineError(`Erreur saveEngineState: ${err.message}`, "core");
  }
}

export async function updateEngineState(status, checkup = {}) {
  try {
    if (!(await ensureMongoReady())) return;
    const state = await EngineState.findOneAndUpdate(
      {},
      { status, lastRun: new Date(), checkup },
      { new: true, upsert: true }
    );
    await addEngineLog(`État moteur mis à jour : ${status}`, "info", "core");
    return state;
  } catch (err) {
    await addEngineError(`Erreur updateEngineState: ${err.message}`, "core");
  }
}

export async function getEngineState() {
  try {
    if (!(await ensureMongoReady())) return { status: "fail", lastRun: null, errorList: [] };
    const state = await EngineState.findOne({});
    return state || { status: "idle", lastRun: null, checkup: {}, errorList: [] };
  } catch (err) {
    await addEngineError(`Erreur getEngineState: ${err.message}`, "core");
    return { status: "fail", lastRun: null, errorList: [] };
  }
}

// ==========================================================
// 🛑 Gestion du drapeau d’arrêt manuel
// ==========================================================
let extractionStopped = false;
export function stopExtraction() {
  extractionStopped = true;
  const msg = "🛑 Extraction stoppée manuellement";
  console.warn(msg);
  engineEvents.emit("log", { message: msg, level: "warning", module: "core", timestamp: new Date() });
  if (externalLogStream) externalLogStream(msg);
}
export function resetStopFlag() {
  extractionStopped = false;
  const msg = "✅ Flag stop extraction réinitialisé";
  console.log(msg);
  engineEvents.emit("log", { message: msg, level: "info", module: "core", timestamp: new Date() });
  if (externalLogStream) externalLogStream(msg);
}
export function isExtractionStopped() {
  return extractionStopped;
}

// ==========================================================
// 🧠 Initialisation moteur
// ==========================================================
export async function initEngineState() {
  if (!(await ensureMongoReady())) return;
  const existing = await EngineState.findOne({});
  if (!existing) {
    await EngineState.create({
      status: "idle",
      lastRun: null,
      checkup: { engineStatus: "init" },
      errorList: [],
      extractionHistory: [],
    });
    await addEngineLog("💡 État moteur initialisé", "info", "core");
  }
  await addEngineLog("🔋 Initialisation moteur TINSFLASH terminée", "info", "core");
}

// ==========================================================
// 🧩 Gestion intelligente des extractions (horodatées)
// ==========================================================
export async function setLastExtraction({ id, zones = [], files = [], ts = new Date(), status = "done" }) {
  try {
    if (!(await ensureMongoReady())) return;
    const state = (await EngineState.findOne({})) || new EngineState();
    const zoneName = zones.join(", ") || "Zone inconnue";

    const record = { id, zones, files, ts: new Date(ts), status, timestamp: Date.now() };
    state.extractionHistory = (state.extractionHistory || []).filter(
      (r) => !zones.some((z) => r.zones?.includes(z))
    );
    state.extractionHistory.push(record);
    state.lastExtraction = record;
    await state.save();

    await addEngineLog(
      `🧾 Extraction ${zoneName} enregistrée (${status}) à ${new Date(ts).toLocaleTimeString()}`,
      "info",
      "extraction"
    );
    return state;
  } catch (err) {
    await addEngineError(`Erreur setLastExtraction : ${err.message}`, "extraction");
  }
}

// ==========================================================
// 🔍 Récupération des extractions récentes (<2h par défaut)
// ==========================================================
export async function getRecentExtractions(hours = 2) {
  try {
    if (!(await ensureMongoReady())) return [];
    const state = await EngineState.findOne({});
    if (!state || !Array.isArray(state.extractionHistory)) return [];

    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const recent = state.extractionHistory.filter((r) => r.timestamp >= cutoff);

    if (!recent.length) {
      await addEngineLog(`⏳ Aucune extraction récente (<${hours}h) trouvée`, "warning", "extraction");
    } else {
      await addEngineLog(`📡 ${recent.length} extraction(s) récente(s) détectée(s)`, "info", "extraction");
    }

    return recent;
  } catch (err) {
    await addEngineError(`Erreur getRecentExtractions : ${err.message}`, "extraction");
    return [];
  }
}

// ==========================================================
// 💾 saveExtractionToMongo – Sauvegarde Phase 1 (superForecast)
// ==========================================================
const ExtractionSchema = new mongoose.Schema({
  zoneName: String,
  continentCode: String,
  results: Array,
  timestamp: { type: Date, default: Date.now },
});

let ExtractionModel;
try {
  ExtractionModel = mongoose.model("Extraction");
} catch {
  ExtractionModel = mongoose.model("Extraction", ExtractionSchema);
}

export async function saveExtractionToMongo(zoneName, continentCode, results) {
  try {
    if (!(await ensureMongoReady())) return { success: false, error: "Mongo non connecté" };
    if (!Array.isArray(results) || results.length === 0) throw new Error("Aucune donnée valide à sauvegarder");

    const doc = new ExtractionModel({ zoneName, continentCode, results });
    await doc.save();

    console.log(`✅ [Mongo] Données ${zoneName} (${results.length} points) sauvegardées avec succès.`);
    return { success: true, count: results.length };
  } catch (err) {
    console.error(`❌ [Mongo] Échec sauvegarde ${zoneName}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ==========================================================
// 📤 Exports
// ==========================================================
export default {
  addEngineLog,
  addEngineError,
  updateEngineState,
  saveEngineState,
  getEngineState,
  stopExtraction,
  resetStopFlag,
  isExtractionStopped,
  initEngineState,
  setLastExtraction,
  getRecentExtractions,
  EngineState,
  EngineLog,
  engineEvents,
  bindExternalLogStream,
};
