// ==========================================================
// 🕰️  TINSFLASH – tocsinCron.js
// v1.0 REAL CONNECT – Boucle automatique de surveillance
// ==========================================================
// Exécute watchdogService (pré-alertes) toutes les 30 min
// et notificationService (Telegram/Pushover) toutes les 60 min.
// Compatible Render ou exécution locale via node tocsinCron.js
// ==========================================================

import { runWatchdog } from "./watchdogService.js";
import { runNotificationDigest } from "./notificationService.js";
import { addEngineLog, addEngineError } from "./engineState.js";

// Fréquences en ms
const WATCHDOG_INTERVAL = 30 * 60 * 1000;   // 30 min
const NOTIFY_INTERVAL   = 60 * 60 * 1000;   // 60 min

// Lancement immédiat au démarrage
(async () => {
  try {
    await addEngineLog("🚀 Mode TOCSIN – Démarrage surveillance automatique", "info", "TOCSIN");
    await runWatchdog();
    await runNotificationDigest();
  } catch (e) {
    await addEngineError("Erreur lancement TOCSIN : " + e.message, "TOCSIN");
  }
})();

// Boucle planifiée
setInterval(async () => {
  try {
    await runWatchdog();
  } catch (e) {
    await addEngineError("Erreur cycle Watchdog : " + e.message, "TOCSIN");
  }
}, WATCHDOG_INTERVAL);

setInterval(async () => {
  try {
    await runNotificationDigest();
  } catch (e) {
    await addEngineError("Erreur cycle Notification : " + e.message, "TOCSIN");
  }
}, NOTIFY_INTERVAL);

// Gestion propre de l’arrêt
process.on("SIGINT", async () => {
  await addEngineLog("🛑 TOCSIN arrêté manuellement", "info", "TOCSIN");
  process.exit(0);
});
