// services/runContinental.js
import { saveEngineState, addLog, getEngineState } from "./engineState.js";

export default async function runContinental() {
  const startTime = new Date().toISOString();
  addLog("RUN CONTINENTAL démarré", "info");

  try {
    // Ici on simule un scan global (hors zones couvertes)
    const zones = ["Afrique", "Asie", "Amérique du Sud", "Océanie"];
    const alertsContinental = true; // si pipeline continental a tourné

    // Récupération état existant
    const currentState = getEngineState();

    // Calcul assemblage mondial : locales + nationales + continentales
    const alertsWorld =
      (currentState.alerts.local || false) ||
      (currentState.alerts.national || false) ||
      alertsContinental;

    // Sauvegarde état moteur
    saveEngineState({
      runTime: startTime,
      models: currentState.models,
      sources: currentState.sources,
      forecasts: currentState.forecasts,
      alerts: {
        local: currentState.alerts.local,
        national: currentState.alerts.national,
        continental: alertsContinental,
        world: alertsWorld,
      },
      ia: {
        forecasts: currentState.ia.forecasts,
        alerts: currentState.ia.alerts,
      },
    });

    addLog("RUN CONTINENTAL terminé", "success");

    return {
      success: true,
      result: {
        startedAt: startTime,
        continentsProcessed: zones.length,
        alerts: alertsContinental ? 1 : 0,
      },
    };
  } catch (err) {
    addLog("Erreur RUN CONTINENTAL: " + err.message, "error");
    return { success: false, error: err.message };
  }
}
