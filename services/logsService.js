// services/logsService.js

let logs = [];

/**
 * Ajoute un log au tableau mémoire
 * @param {string} msg
 */
export function addLog(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  logs.push(entry);

  // On garde seulement les 100 derniers logs
  if (logs.length > 100) logs = logs.slice(-100);
}

/**
 * Récupère tous les logs en mémoire
 * @returns {string[]}
 */
export function getLogs() {
  return logs;
}
