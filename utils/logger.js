// utils/logger.js
let logs = [];

export function logInfo(message) {
  const log = `[INFO] ${new Date().toISOString()} - ${message}`;
  console.log(log);
  logs.push(log);
  if (logs.length > 200) logs.shift(); // garde les 200 derniers logs
}

export function logError(message) {
  const log = `[ERROR] ${new Date().toISOString()} - ${message}`;
  console.error(log);
  logs.push(log);
  if (logs.length > 200) logs.shift();
}

export function getLogs() {
  return logs;
}
