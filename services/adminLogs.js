// services/adminLogs.js
let logs = [];

export function addLog(message) {
  const entry = { timestamp: new Date().toISOString(), message };
  logs.unshift(entry);
  if (logs.length > 200) logs = logs.slice(0, 200);
}

export function getLogs() {
  return logs;
}
