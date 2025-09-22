// services/logsService.js
let logs = [];

/**
 * Ajoute un log dans la mémoire + console Render
 * @param {string} message
 */
export function addLog(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  logs.push(entry);

  // Garder uniquement les 200 derniers logs
  if (logs.length > 200) logs.shift();

  console.log(entry); // visible aussi dans les logs Render
}

/**
 * Retourne les logs stockés
 */
export function getLogs() {
  return { logs };
}
