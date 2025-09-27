// services/runGlobal.js
import { saveEngineState, addEngineLog, addEngineError } from "./engineState.js";

export default async function runGlobal() {
  const startedAt = new Date().toISOString();
  addEngineLog("RUN GLOBAL démarré");

  try {
    // === Simuler ingestion réelle des modèles météo ===
    // (à remplacer par tes vrais connecteurs d’API GFS, ECMWF, ICON, Meteomatics…)
    const sources = {
      GFS: {
        time: startedAt,      // horodatage de la donnée récupérée
        status: "ok",         // ok | outdated | error
        provider: "NOAA GFS"
      },
      ECMWF: {
        time: startedAt,
        status: "ok",
        provider: "ECMWF"
      },
      ICON: {
        time: startedAt,
        status: "ok",
        provider: "DWD ICON"
      },
      Meteomatics: {
        time: startedAt,
        status: "ok",
        provider: "Meteomatics API"
      }
    };

    // === Exemple zones couvertes (Europe + US + UK + Ukraine + Norvège) ===
    const zonesCovered = {
      Germany: true, Austria: true, Belgium: true, France: true,
      Spain: true, Italy: true, Portugal: true, Netherlands: true,
      Poland: true, Sweden: true, Finland: true, Denmark: true,
      Norway: true, Ukraine: true, UnitedKingdom: true,
      USA: true
      // ... (complète si nécessaire)
    };

    // === Mise à jour état moteur ===
    saveEngineState({
      runTime: startedAt,
      zonesCovered,
      sources,
      alertsList: [] // pas d’alertes ici, ce sera géré dans alertsService
    });

    addEngineLog("RUN GLOBAL terminé");

    return {
      success: true,
      result: {
        startedAt,
        countriesProcessed: Object.keys(zonesCovered).length,
        alerts: 0
      }
    };
  } catch (err) {
    addEngineError(err);
    return { success: false, error: err.message };
  }
}
