// services/runGlobal.js
// ⚡ Centrale nucléaire météo – Centralisation et orchestration
// Zones couvertes : UE27 + UK + Ukraine + Norvège + Suisse + USA

// === Imports zones et runners ===
import { EUROPE_ZONES, runGlobalEurope } from "./runGlobalEurope.js";
import { USA_ZONES, runGlobalUSA } from "./runGlobalUSA.js";
import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";

// ✅ Fusion de toutes les zones disponibles
export const ALL_ZONES = {
  ...EUROPE_ZONES,
  ...USA_ZONES,
  // Ajouts futurs :
  // ...CANADA_ZONES,
  // ...AFRICA_ZONES,
  // ...ASIA_ZONES,
};

// ✅ Fonction centrale
export async function runGlobal(zone = "Europe") {
  const state = getEngineState();
  try {
    addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})`);
    state.runTime = new Date().toISOString();
    state.checkup = {
      models: "PENDING",
      localForecasts: "PENDING",
      nationalForecasts: "PENDING",
      aiAlerts: "PENDING",
    };
    saveEngineState(state);

    let result;

    if (zone === "Europe") {
      result = await runGlobalEurope();
    } else if (zone === "USA") {
      result = await runGlobalUSA();
    } else if (zone === "All") {
      const europe = await runGlobalEurope();
      const usa = await runGlobalUSA();
      result = { Europe: europe, USA: usa };
    } else {
      throw new Error(`Zone inconnue: ${zone}`);
    }

    state.checkup.engineStatus = "OK";
    saveEngineState(state);
    addEngineLog(`✅ RUN GLOBAL terminé (${zone})`);

    return result;
  } catch (err) {
    addEngineError(err.message || "Erreur inconnue RUN GLOBAL");
    state.checkup.engineStatus = "FAIL";
    saveEngineState(state);
    addEngineLog(`❌ RUN GLOBAL échec (${zone})`);
    return { error: err.message };
  }
}

// ✅ Export par défaut pour compatibilité Render
export default { runGlobal, ALL_ZONES };
