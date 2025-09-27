// services/alertsService.js
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

export async function processAlerts() {
  const state = getEngineState();
  try {
    addEngineLog("🔔 Démarrage du module Alertes...");

    const alerts = state.alertsList || [];

    // Tri par fiabilité
    const highConfidence = alerts.filter(a => a.reliability > 90);
    const toValidate     = alerts.filter(a => a.reliability >= 70 && a.reliability <= 90);
    const ignored        = alerts.filter(a => a.reliability < 70);

    state.alerts = { highConfidence, toValidate, ignored };
    saveEngineState(state);

    addEngineLog("✅ Module Alertes terminé");

    return { 
      published: highConfidence.length, 
      pending: toValidate.length, 
      ignored: ignored.length 
    };

  } catch (err) {
    addEngineError(err.message || "Erreur inconnue dans alertsService");
    addEngineLog("❌ Erreur module Alertes");
    return { error: err.message };
  }
}

// === Fonctions attendues par server.js ===
export function getActiveAlerts() {
  const state = getEngineState();
  return state?.alerts?.highConfidence || [];
}

export function getPendingAlerts() {
  const state = getEngineState();
  return state?.alerts?.toValidate || [];
}

export function updateAlertStatus(id, action) {
  const state = getEngineState();
  if (!state?.alerts) return null;

  let alert;
  // Recherche dans les pending
  const idx = state.alerts.toValidate?.findIndex(a => a.id === id);
  if (idx >= 0) {
    alert = state.alerts.toValidate[idx];
    // Mise à jour
    if (action === "approve") {
      state.alerts.highConfidence.push(alert);
      state.alerts.toValidate.splice(idx, 1);
    } else if (action === "ignore") {
      state.alerts.ignored.push(alert);
      state.alerts.toValidate.splice(idx, 1);
    }
    saveEngineState(state);
  }
  return alert;
}
