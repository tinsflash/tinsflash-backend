// services/runGlobal.js
// ⚡ Centrale nucléaire météo — Coordination globale (Europe / USA / All)

const { runGlobalEurope } = require("./runGlobalEurope.js");
const { runGlobalUSA } = require("./runGlobalUSA.js");
const { addEngineLog, addEngineError, saveEngineState, getEngineState } = require("./engineState.js");

async function runGlobal(zone = "Europe") {
  const state = getEngineState();
  try {
    addEngineLog(`🌍 Lancement du RUN GLOBAL (${zone})`);
    state.runTime = new Date().toISOString();
    state.checkup = {
      models: "PENDING",
      localForecasts: "PENDING",
      nationalForecasts: "PENDING",
      aiAlerts: "PENDING"
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

module.exports = { runGlobal };
