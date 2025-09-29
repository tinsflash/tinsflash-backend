// services/adminLogs.js
import Log from "../models/Log.js";

// ✅ Ajout d’un log normal
export async function addLog(message) {
  try {
    const log = new Log({ message, type: "info", timestamp: new Date() });
    await log.save();
  } catch (err) {
    console.error("Erreur addLog:", err);
  }
}

// ✅ Ajout d’un log d’erreur
export async function addError(message) {
  try {
    const log = new Log({ message, type: "error", timestamp: new Date() });
    await log.save();
  } catch (err) {
    console.error("Erreur addError:", err);
  }
}

// ✅ Récupération des logs
export async function getLogs() {
  try {
    return await Log.find().sort({ timestamp: -1 }).limit(200);
  } catch (err) {
    console.error("Erreur getLogs:", err);
    return [];
  }
}
