// utils/logger.js
// -------------------------
// Gestion centralisée des logs

export function logInfo(msg) {
  console.log("ℹ️ " + new Date().toISOString() + " - " + msg);
}

export function logError(msg) {
  console.error("❌ " + new Date().toISOString() + " - " + msg);
}
