// services/runGlobal.js
import { saveEngineState, addLog, getEngineState } from "./engineState.js";

export default async function runGlobal() {
  const startTime = new Date().toISOString();
  addLog("RUN GLOBAL démarré", "info");

  try {
    // Simulation extraction de modèles
    const modelsOK = ["GFS (NOAA)", "ECMWF", "ICON (DWD)", "Meteomatics"];
    const modelsKO = []; // si un modèle tombe, on le met ici

    // Simulation sources
    const sourcesOK = modelsOK; // supposons que les mêmes sources répondent
    const sourcesKO = [];

    // Prévisions générées (à brancher plus tard sur forecastService)
    const forecastsLocal = true;
    const forecastsNational = true;

    // Alertes générées (zones couvertes → locales + nationales)
    const alertsLocal = true;      // si pipeline alertes locales a tourné
    const alertsNational = true;   // idem au niveau national

    // Assemblage avec alertes mondiales (se mettra à jour si continental aussi a tourné)
    const alertsWorld = false; // initialement false, sera recalculé

    // Open-data non concerné ici
    const forecastsOpenData = null;

    // Analyse IA (prévisions + alertes)
    const iaForecasts = true; // IA a analysé les prévisions
    const iaAlerts = true;    // IA a analysé les alertes

    // Sauvegarde état moteur
    saveEngineState({
      runTime: startTime,
      models: { ok: modelsOK, ko: modelsKO },
      sources: { ok: sourcesOK, ko: sourcesKO },
      forecasts: {
        local: forecastsLocal,
        national: forecastsNational,
        openData: forecastsOpenData,
      },
      alerts: {
        local: alertsLocal,
        national: alertsNational,
        continental: getEngineState().alerts.continental, // on conserve si déjà calculé
        world: alertsWorld,
      },
      ia: {
        forecasts: iaForecasts,
        alerts: iaAlerts,
      },
    });

    addLog("RUN GLOBAL terminé", "success");

    return {
      success: true,
      result: {
        startedAt: startTime,
        countriesProcessed: 31,
        alerts: alertsLocal || alertsNational ? 1 : 0,
      },
    };
  } catch (err) {
    addLog("Erreur RUN GLOBAL: " + err.message, "error");
    return { success: false, error: err.message };
  }
}
