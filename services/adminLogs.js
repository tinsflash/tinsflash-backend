// services/adminLogs.js
import { addEngineLog as dbAddLog, addEngineError as dbAddErr, getEngineState, saveEngineState } from "./engineState.js";

let clients = [];
let currentCycleId = null;

/** 🔑 Générer un cycleId */
function generateCycleId() {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "-" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
}

/** 🚀 Démarrer un nouveau cycle */
export async function startNewCycle() {
  currentCycleId = generateCycleId();
  const state = await getEngineState();
  state.currentCycleId = currentCycleId;
  state.logs = state.logs || [];
  state.logs.push({ ts: Date.now(), type: "INFO", cycleId: currentCycleId, message: `🔄 Nouveau cycle démarré : ${currentCycleId}` });
  await saveEngineState(state);
  broadcastLog({ ts: Date.now(), type: "INFO", cycleId: currentCycleId, message: `🔄 Nouveau cycle démarré : ${currentCycleId}` });
  return currentCycleId;
}

/** 🔌 Ajout d’un client SSE */
export function registerClient(res) {
  clients.push(res);
  res.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
}

/** 📡 Diffuser un log en direct */
function broadcastLog(log) {
  clients.forEach(c => c.write(`data: ${JSON.stringify(log)}\n\n`));
}

/** ✅ Ajout log INFO */
export async function addLog(message) {
  if (!currentCycleId) await startNewCycle();
  const log = await dbAddLog(`[${currentCycleId}] ${message}`);
  log.cycleId = currentCycleId;
  broadcastLog(log);
  return log;
}

/** ❌ Ajout log ERROR */
export async function addError(message) {
  if (!currentCycleId) await startNewCycle();
  const log = await dbAddErr(`[${currentCycleId}] ${message}`);
  log.cycleId = currentCycleId;
  broadcastLog(log);
  return log;
}

/** 🔎 Lire tous les logs */
export async function getLogs(cycleId = null) {
  const state = await getEngineState();
  const allLogs = state.logs || [];
  if (cycleId === "current" && state.currentCycleId) {
    return allLogs.filter(l => l.cycleId === state.currentCycleId);
  }
  if (cycleId && cycleId !== "all") {
    return allLogs.filter(l => l.cycleId === cycleId);
  }
  return allLogs; // par défaut tout
}
