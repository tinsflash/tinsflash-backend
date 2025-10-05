// PATH: services/timeUtils.js
// 🕒 Utilitaires temporels pour le moteur météo TINSFLASH

/**
 * Retourne un horodatage global unique (ex: 2025-10-06T00-01-15Z)
 */
export function getGlobalTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(
    now.getUTCDate()
  )}T${pad(now.getUTCHours())}-${pad(now.getUTCMinutes())}-${pad(
    now.getUTCSeconds()
  )}Z`;
}

/**
 * Retourne le temps écoulé depuis une date (en secondes)
 */
export function elapsedSince(date) {
  if (!date) return null;
  const now = new Date();
  return Math.round((now - new Date(date)) / 1000);
}

/**
 * Vérifie si un run est récent (moins de X minutes)
 */
export function isRecentRun(lastRun, maxMinutes = 30) {
  const seconds = elapsedSince(lastRun);
  return seconds !== null && seconds <= maxMinutes * 60;
}

export default { getGlobalTimestamp, elapsedSince, isRecentRun };
