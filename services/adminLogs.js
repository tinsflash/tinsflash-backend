// PATH: services/adminLogs.js
// 🛰️ Gestion centralisée des logs d’administration TINSFLASH (Everest Protocol v1.1)

import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = path.join(LOG_DIR, "admin.log");
const ALERT_FILE = path.join(LOG_DIR, "alerts.log");

let currentCycleId = null;
let listeners = [];

/* ============================================================
   🧠 Broadcaster temps réel
============================================================ */
function broadcast(entry) {
  for (const cb of listeners) {
    try {
      cb(entry);
    } catch (e) {
      console.error("Listener error:", e.message);
    }
  }
}

/* ============================================================
   🛰️ Gestion des cycles
============================================================ */
export async function startNewCycle(prefix = "RUN") {
  currentCycleId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  const line = `[${new Date().toISOString()}] 🔄 Nouveau cycle démarré [${currentCycleId}]`;
  fs.appendFileSync(LOG_FILE, line + "\n");
  console.log(line);
  broadcast({ ts: Date.now(), type: "INFO", message: line, cycleId: currentCycleId });
  return currentCycleId;
}

/* ============================================================
   ✍️ Fonctions internes de stockage
============================================================ */
function writeToFile(file, text) {
  const line = `[${new Date().toISOString()}] ${text}\n`;
  fs.appendFileSync(file, line);
  return line;
}

/* ============================================================
   📜 Gestion des logs généraux
============================================================ */
export async function addLog(message) {
  if (!currentCycleId) await startNewCycle("GEN");
  const line = writeToFile(LOG_FILE, `[${currentCycleId}] ${message}`);
  const entry = { ts: Date.now(), type: "INFO", message: line.trim(), cycleId: currentCycleId };
  console.log(line.trim());
  broadcast(entry);
  return entry;
}

export async function addError(message) {
  if (!currentCycleId) await startNewCycle("ERR");
  const line = writeToFile(LOG_FILE, `[${currentCycleId}] [ERROR] ${message}`);
  const entry = { ts: Date.now(), type: "ERROR", message: line.trim(), cycleId: currentCycleId };
  console.error(line.trim());
  broadcast(entry);
  return entry;
}

/* ============================================================
   🚨 Logs d’alertes (Everest)
============================================================ */
export async function addAlertLog(message, level = "INFO", zone = "GLOBAL") {
  const prefix = level === "ERROR" ? "🚨❌" : level === "WARN" ? "⚠️" : "🚨";
  const line = writeToFile(ALERT_FILE, `${prefix} [${zone}] ${message}`);
  const entry = {
    ts: Date.now(),
    type: level,
    message: line.trim(),
    zone,
    cycleId: currentCycleId,
  };
  console.log(line.trim());
  broadcast(entry);
  return entry;
}

/* ============================================================
   📡 Abonnement aux logs temps réel (SSE)
============================================================ */
export function onLog(cb) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((f) => f !== cb);
  };
}

/* ============================================================
   📂 Lecture historique (derniers logs)
============================================================ */
export async function getLogs(limit = 500, type = "admin") {
  const file = type === "alerts" ? ALERT_FILE : LOG_FILE;
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf-8").trim().split("\n");
  return lines.slice(-limit).map((l) => ({
    ts: Date.now(),
    message: l,
    type: l.includes("[ERROR]") ? "ERROR" : "INFO",
  }));
}

/* ============================================================
   ♻️ Maintenance (rotation & purge)
============================================================ */
export async function rotateLogs() {
  try {
    const size = fs.statSync(LOG_FILE).size;
    if (size > 5 * 1024 * 1024) {
      const archive = path.join(LOG_DIR, `admin_${Date.now()}.log`);
      fs.renameSync(LOG_FILE, archive);
      fs.writeFileSync(LOG_FILE, "");
      await addLog(`🧹 Rotation des logs effectuée (${archive})`);
    }
  } catch (err) {
    console.warn("Rotation logs échouée:", err.message);
  }
}
