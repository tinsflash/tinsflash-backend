// services/alertsService.js
import { getEngineState } from "./engineState.js";

/**
 * Retourne les alertes actives depuis l'état moteur
 * - covered : alertes nationales stockées
 * - global : alertes continentales (à compléter plus tard si besoin)
 */
export async function getActiveAlerts() {
  const state = getEngineState();
  return {
    covered: state.alertsList || [],
    global: [],
    error: state.errors?.length ? "Certaines zones ont échoué" : null
  };
}
