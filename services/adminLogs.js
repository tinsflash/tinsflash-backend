// services/adminLogs.js
let logs = [];

export function addLog(message) {
  const entry = {
    message,
    timestamp: new Date(),
  };
  logs.push(entry);

  // On limite à 200 logs max pour éviter que ça explose en mémoire
  if (logs.length > 200) logs.shift();

  console.log(`[ADMIN LOG] ${entry.timestamp.toISOString()} - ${message}`);
}

export function getLogs() {
  return logs;
}
