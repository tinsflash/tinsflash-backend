// PATH: services/engineState.js
// ⚙️ Suivi et état du moteur TINSFLASH (Everest Protocol v1.2)
// 100 % réel – stockage Mongo + indicateurs IA

import mongoose from "mongoose";
import { enumerateCoveredPoints } from "./zonesCovered.js";
import Alert from "../models/Alert.js";

// === Schémas internes ===
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
  partialReport: { type: Object, default: null },
  finalReport: { type: Object, default: null },
  alertsLocal: { type: Array, default: [] },
  alertsContinental: { type: Array, default: [] },
  alertsWorld: { type: Array, default: [] },
  errors: [ErrorSchema],
  logs: [LogSchema],
});

const EngineState =
  mongoose.models.EngineState ||
  mongoose.model("EngineState", EngineStateSchema);

// ======================================================
// 🔍 Lecture + maintenance automatique
// ======================================================
export async function getEngineState() {
  let state = await EngineState.findOne().sort({ _id: -1 });
  if (!state) {
    state = new EngineState({ status: "idle" });
    await state.save();
  }

  // 1️⃣ Nettoyage des alertes archivées (plus de 30 jours)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await Alert.deleteMany({ status: "archived", lastCheck: { $lt: cutoff } });

  // 2️⃣ Calcul des indicateurs de fiabilité IA
  const activeAlerts = await Alert.find({ status: { $ne: "archived" } });
  const avgCertainty =
    activeAlerts.length > 0
      ? (
          activeAlerts.reduce(
            (sum, a) => sum + (a.certainty || a.data?.confidence || 0),
            0
          ) / activeAlerts.length
        ).toFixed(1)
      : 0;

  // 3️⃣ Injection zones couvertes et indicateurs dans checkup
  const coveredPoints = enumerateCoveredPoints();
  state.checkup = state.checkup || {};
  state.checkup.coveredPoints = coveredPoints;
  state.checkup.totalZones = coveredPoints.length;
  state.checkup.activeAlerts = activeAlerts.length;
  state.checkup.avgCertainty = Number(avgCertainty);
  state.checkup.engineStatus =
    state.status === "ok" ? "OK" : state.status?.toUpperCase();

  await state.save();
  return state;
}

// ======================================================
// 💾 Sauvegarde et journalisation
// ======================================================
export async function saveEngineState(updated) {
  if (!updated) return null;
  const s = new EngineState(updated);
  await s.save();
  return s;
}

export async function addEngineLog(message) {
  const s = await getEngineState();
  s.logs.push({ message });
  if (s.logs.length > 500) s.logs.shift();
  await s.save();
}

export async function addEngineError(message) {
  const s = await getEngineState();
  s.errors.push({ message });
  if (s.errors.length > 200) s.errors.shift();
  await s.save();
}

export async function clearEngineLogs() {
  const s = await getEngineState();
  s.logs = [];
  await s.save();
}

// ======================================================
// ✅ Export module
// ======================================================
export default {
  getEngineState,
  saveEngineState,
  addEngineLog,
  addEngineError,
  clearEngineLogs,
};
