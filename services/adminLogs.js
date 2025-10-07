// PATH: services/adminLogs.js
// 🛰️ Gestion centralisée des logs d’administration (temps réel)
import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "logs", "admin.log");
let currentCycleId = null;
let listeners = [];

function broadcastLog(entry) {
  for (const cb of listeners) cb(entry);
}

export function onLog(cb) {
  listeners.push(cb);
  return () => (listeners = listeners.filter((f) => f !== cb));
}

// Simulation stockage local minimal (optionnel Mongo)
async function dbAddLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

async function dbAddErr(message) {
  const line = `[${new Date().toISOString()}] [ERROR] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

export async function startNewCycle() {
  currentCycleId = Date.now().toString(36).toUpperCase();
  await dbAddLog(`🔄 Nouveau cycle de logs démarré [${currentCycleId}]`);
}

export async function addLog(message) {
  if (!currentCycleId) await startNewCycle();
  await dbAddLog(`[${currentCycleId}] ${message}`);
  const entry = {
    ts: Date.now(),
    type: "INFO",
    message: `[${currentCycleId}] ${message}`,
    cycleId: currentCycleId,
  };
  broadcastLog(entry);
  return entry;
}

export async function addError(message) {
  if (!currentCycleId) await startNewCycle();
  await dbAddErr(`[${currentCycleId}] ${message}`);
  const entry = {
    ts: Date.now(),
    type: "ERROR",
    message: `[${currentCycleId}] ${message}`,
    cycleId: currentCycleId,
  };
  broadcastLog(entry);
  return entry;
}

export async function getLogs(limit = 500) {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, "utf-8").trim().split("\n");
  return lines.slice(-limit).map((l) => ({ message: l, ts: Date.now() }));
}
