// services/adminLogs.js
// 📡 Gestion des logs en temps réel pour la console admin

let logs = [];

export async function getLogs() {
  return logs;
}

export async function addLog(message) {
  const entry = `[${new Date().toISOString()}] ${message}`;
  console.log(entry); // log aussi côté serveur
  logs.push(entry);

  // On garde uniquement les 200 derniers logs pour éviter les débordements
  if (logs.length > 200) logs.shift();
}
