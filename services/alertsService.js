// services/alertsService.js
import { addEngineLog, addEngineError, saveEngineState, getEngineState } from "./engineState.js";

export async function processAlerts() {
  const state = getEngineState();
  try {
    addEngineLog("🔔 Démarrage du module Alertes...");

    // Ici ton pipeline d’alertes
    const alerts = state.alertsList || [];

    // Exemple tri par fiabilité
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
