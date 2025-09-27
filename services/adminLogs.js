// services/adminLogs.js

let logs = [];

/**
 * Ajoute une entrée simple (console admin)
 */
export function addLog(message) {
  const entry = {
    timestamp: new Date().toISOString(),
    message
  };
  logs.unshift(entry);

  // garder max 200 logs
  if (logs.length > 200) logs = logs.slice(0, 200);
}

/**
 * Récupère l’historique des logs
 */
export function getLogs() {
  return logs;
}
