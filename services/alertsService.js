// services/alertsService.js
import { getEngineState } from "./engineState.js";

/**
 * Retourne les alertes actives depuis l'état moteur :
 * - covered : alertes locales/nationales
 * - global : alertes continentales (future extension)
 */
export async function getActiveAlerts() {
  const state = getEngineState();

  return {
    covered: state.alertsList || [],
    global: [], // on remplira plus tard avec l'analyse continentale
    error: state.errors?.length ? `⚠️ ${state.errors.length} zones ont échoué` : null
  };
}
