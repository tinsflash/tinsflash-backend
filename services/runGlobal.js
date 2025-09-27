// services/runGlobal.js
import { getEngineState, saveEngineState, addEngineLog, addEngineError } from "./engineState.js";

export async function runGlobal() {
  const state = getEngineState();
  const startTime = new Date().toISOString();

  try {
    addEngineLog("RUN GLOBAL démarré");

    // === Simulation de l'extraction réelle des modèles météo ===
    // Ici ton moteur connecte GFS, ECMWF, ICON, Meteomatics, etc.
    // Chaque source ajoutée est stockée avec horodatage et statut.
    state.runTime = startTime;
    state.sources = [
      { name: "GFS (NOAA)", status: "ok", ts: startTime },
      { name: "ECMWF (Europe)", status: "ok", ts: startTime },
      { name: "ICON (DWD)", status: "ok", ts: startTime },
      { name: "Meteomatics API", status: "ok", ts: startTime },
    ];

    // === Exemple zones traitées ===
    state.zonesCovered = {
      Belgium: true,
      France: true,
      Germany: true,
      Spain: true,
      Italy: true,
      USA: true,
      UK: true,
      Ukraine: true,
    };

    // === Prévisions & alertes générées ===
    // Ici tu branches ton pipeline réel
    const alerts = []; // pipeline IA météo → à enrichir
    state.alertsList = alerts;

    // === Sauvegarde du nouvel état ===
    saveEngineState(state);

    addEngineLog("RUN GLOBAL terminé");

    return {
      startedAt: startTime,
      countriesProcessed: Object.keys(state.zonesCovered).length,
      alerts: alerts.length,
    };

  } catch (err) {
    // ✅ Ajout de l’erreur via addEngineError
    addEngineError(err.message || "Erreur inconnue dans runGlobal");
    addEngineLog("❌ Erreur RUN GLOBAL");

    return { error: err.message };
  }
}
