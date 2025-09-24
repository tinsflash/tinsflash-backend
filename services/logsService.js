// services/logsService.js
import Log from "../models/Log.js";

/**
 * Ajoute un log dans MongoDB
 * @param {string} message - Texte du log
 */
export async function addLog(message) {
  try {
    const log = new Log({ message });
    await log.save();
    console.log(`[LOG] ${message}`);
  } catch (err) {
    console.error("❌ Erreur ajout log:", err.message);
  }
}

/**
 * Récupère les logs récents
 * @param {number} limit - Nombre maximum de logs
 */
export async function getLogs(limit = 200) {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(limit);
    return logs;
  } catch (err) {
    console.error("❌ Erreur récupération logs:", err.message);
    return [];
  }
}

export default { addLog, getLogs };
