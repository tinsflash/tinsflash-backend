// services/alertsService.js
// 🚨 Gestion centralisée des alertes météo

import { addLog } from "./adminLogs.js";

// Mémoire interne des alertes
let alerts = [];

/**
 * Récupère les alertes actives
 */
export async function getActiveAlerts() {
  return alerts.filter(a => a.status !== "ignored");
}

/**
 * Ajoute une nouvelle alerte
 * @param {*} alert { continent, country?, region?, type, reliability, firstDetector }
 */
export async function addAlert(alert) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    ...alert,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  alerts.push(entry);
  await addLog(`🚨 Nouvelle alerte: ${alert.type} (${alert.reliability}%) ${alert.continent || alert.country}`);
  return entry;
}

/**
 * Met à jour le statut d’une alerte
 */
export async function updateAlertStatus(id, action) {
  const alert = alerts.find(a => a.id === id);
  if (!alert) return null;

  switch (action) {
    case "validate":
      alert.status = "validated";
      await addLog(`✅ Alerte validée: ${alert.type} (${alert.continent || alert.country})`);
      break;
    case "ignore":
      alert.status = "ignored";
      await addLog(`❌ Alerte ignorée: ${alert.type} (${alert.continent || alert.country})`);
      break;
    default:
      await addLog(`⚠️ Action inconnue sur alerte ${id}: ${action}`);
  }
  return alert;
}

/**
 * Traitement global (ex. après runGlobal ou runContinental)
 */
export async function processAlerts() {
  try {
    // Pour l’instant simple récap
    const stats = {
      total: alerts.length,
      validated: alerts.filter(a => a.status === "validated").length,
      new: alerts.filter(a => a.status === "new").length,
      ignored: alerts.filter(a => a.status === "ignored").length,
    };
    await addLog(`📊 Traitement des alertes terminé: ${stats.total} total (${stats.validated} validées)`);
    return stats;
  } catch (err) {
    await addLog("💥 Erreur processAlerts: " + err.message);
    return { error: err.message };
  }
}
