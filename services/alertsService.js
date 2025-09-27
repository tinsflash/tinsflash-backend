// services/alertsService.js
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

// Buckets d’alertes
let alertsBuckets = {
  published: [],   // >90% publiées auto
  toValidate: [],  // 70–90% attente admin/expert
  waiting: [],     // suivies dans le temps
  ignored: []      // <70% ignorées
};

// === Génération d’une alerte ===
export function generateAlert({ zoneType, zoneName, description, reliability, firstDetected = false }) {
  const alert = {
    id: `${zoneType}-${zoneName}-${Date.now()}`,
    zoneType,           // "covered" | "continental"
    zoneName,           // ex: "France" ou "Europe"
    description,        // ex: "Tempête majeure prévue"
    reliability,        // 0–100 %
    firstDetected,      // true si nous sommes les premiers
    createdAt: new Date().toISOString(),
    status: null
  };

  // Règle nucléaire fiabilité
  if (reliability < 70) {
    alert.status = "ignored";
    alertsBuckets.ignored.push(alert);
    addEngineLog(`Alerte ignorée (${zoneName}) fiabilité ${reliability}%`);
  } else if (reliability >= 70 && reliability < 90) {
    alert.status = "toValidate";
    alertsBuckets.toValidate.push(alert);
    addEngineLog(`Alerte en attente validation (${zoneName}) fiabilité ${reliability}%`);
  } else {
    alert.status = "published";
    alertsBuckets.published.push(alert);
    addEngineLog(`Alerte publiée automatiquement (${zoneName}) fiabilité ${reliability}%`);
    if (firstDetected) {
      addEngineLog(`🚨 Première détection → notifier NASA + services météo (${zoneName})`);
    }
  }

  return alert;
}

// === Récupérer toutes les alertes actives ===
export function getActiveAlerts() {
  return {
    published: alertsBuckets.published,
    toValidate: alertsBuckets.toValidate,
    waiting: alertsBuckets.waiting,
    ignored: alertsBuckets.ignored
  };
}

// === Mettre à jour le statut d’une alerte ===
export function updateAlertStatus(id, action) {
  let allAlerts = [
    ...alertsBuckets.published,
    ...alertsBuckets.toValidate,
    ...alertsBuckets.waiting,
    ...alertsBuckets.ignored
  ];
  const alert = allAlerts.find(a => a.id === id);
  if (!alert) return { ok: false, error: "Alerte non trouvée" };

  switch (action) {
    case "validate":
      alert.status = "published";
      alertsBuckets.published.push(alert);
      alertsBuckets.toValidate = alertsBuckets.toValidate.filter(a => a.id !== id);
      break;
    case "expert":
      alert.status = "expert";
      alertsBuckets.waiting.push(alert);
      alertsBuckets.toValidate = alertsBuckets.toValidate.filter(a => a.id !== id);
      break;
    case "wait":
      alert.status = "waiting";
      alertsBuckets.waiting.push(alert);
      alertsBuckets.toValidate = alertsBuckets.toValidate.filter(a => a.id !== id);
      break;
    case "ignore":
      alert.status = "ignored";
      alertsBuckets.ignored.push(alert);
      alertsBuckets.toValidate = alertsBuckets.toValidate.filter(a => a.id !== id);
      break;
  }

  addEngineLog(`Alerte ${id} mise à jour → ${action}`);
  return { ok: true, buckets: getActiveAlerts() };
}

// === Alertes mondiales (somme des deux types) ===
export function getGlobalAlerts() {
  return [
    ...alertsBuckets.published,
    ...alertsBuckets.toValidate,
    ...alertsBuckets.waiting
  ];
}

// === Reset (utile en debug ou nouveau run) ===
export function resetAlerts() {
  alertsBuckets = { published: [], toValidate: [], waiting: [], ignored: [] };
  addEngineLog("Réinitialisation des alertes");
}
