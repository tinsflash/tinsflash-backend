// services/alertsService.js
import { addLog, saveEngineState, getEngineState } from "./engineState.js";

let alerts = {
  auto: [],       // >90%
  toValidate: [], // 70–90%
  ignored: [],    // <70%
  comparison: { first: [], others: [] },
};

function classifyAlert(alert) {
  if (alert.fiability > 90) {
    alerts.auto.push(alert);
    addLog(`Alerte publiée automatiquement (${alert.zone}, fiabilité ${alert.fiability}%)`, "success");
  } else if (alert.fiability >= 70) {
    alerts.toValidate.push(alert);
    addLog(`Alerte à valider (${alert.zone}, fiabilité ${alert.fiability}%)`, "warn");
  } else {
    alerts.ignored.push(alert);
    addLog(`Alerte ignorée (${alert.zone}, fiabilité ${alert.fiability}%)`, "info");
  }
}

function compareSources(alert, externalSources) {
  if (externalSources.length === 0) {
    alerts.comparison.first.push(alert);
    addLog(`Nous sommes les SEULS à détecter l’alerte ${alert.id}`, "critical");
  } else {
    alerts.comparison.others.push({ alert, sources: externalSources });
    addLog(`Alerte ${alert.id} aussi vue chez ${externalSources.join(", ")}`, "info");
  }
}

function getAlerts() {
  return alerts;
}

function resetAlerts() {
  alerts = { auto: [], toValidate: [], ignored: [], comparison: { first: [], others: [] } };
  addLog("Réinitialisation des alertes", "system");
  const state = getEngineState();
  saveEngineState({
    ...state,
    alerts: { local: false, national: false, continental: false, world: false },
  });
}

export { classifyAlert, compareSources, getAlerts, resetAlerts };
