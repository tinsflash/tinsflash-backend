// services/logsService.js
let logs = [];

/**
 * Ajoute une entrée dans les logs
 * @param {string} message
 */
export function addLog(message) {
  const timestamp = new Date().toISOString();
  logs.push(`[${timestamp}] ${message}`);
  if (logs.length > 500) logs.shift(); // garder historique limité
}

/**
 * Récupère les logs actuels
 */
export function getLogs() {
  return { logs };
}
