// services/adminLogs.js
import { addEngineLog as dbAddLog, addEngineError as dbAddErr, getEngineState } from "./engineState.js";

let clients = [];

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
  const log = await dbAddLog(message);
  broadcastLog(log);
  return log;
}

/** ❌ Ajout log ERROR */
export async function addError(message) {
  const log = await dbAddErr(message);
  broadcastLog(log);
  return log;
}

/** 🔎 Lire tous les logs (DB) */
export async function getLogs() {
  const state = await getEngineState();
  return state.logs || [];
}
