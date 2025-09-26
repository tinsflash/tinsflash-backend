// services/logsService.js
import Log from "../models/Log.js";

export async function addLog(service, message) {
  try {
    const log = new Log({ service, message, date: new Date() });
    await log.save();
  } catch (err) {
    console.error("❌ Log save error:", err.message);
  }
}

export async function getLogs(limit = 50) {
  try {
    const logs = await Log.find().sort({ date: -1 }).limit(limit).lean();
    return logs.map(l => `[${l.date.toISOString()}] ${l.service}: ${l.message}`);
  } catch (err) {
    console.error("❌ Get logs error:", err.message);
    return ["⚠️ Impossible de charger les logs"];
  }
}
