// services/runGlobal.js
// 🌍 RUN GLOBAL – Europe + USA

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { addLog } from "./adminLogs.js";
import { getEngineState, saveEngineState } from "./engineState.js";

export async function runGlobal(zone = "Europe+USA") {
  const state = await getEngineState();
  state.runTime = new Date().toISOString();
  state.status = "RUNNING";
  state.checkup.models = "PENDING";
  state.checkup.europe = "PENDING";
  state.checkup.usa = "PENDING";
  state.checkup.globalAlerts = "PENDING";
  state.checkup.engineStatus = "PENDING";
  await saveEngineState(state);

  try {
    await addLog("🌍 Lancement du RUN GLOBAL");
    await addLog("📡 Chargement des modèles météo (ECMWF, GFS, ICON, …)");

    // Europe
    await addLog("➡️ Exécution Europe…");
    const europe = await runGlobalEurope();
    state.checkup.europe = europe?.error ? "FAIL" : "OK";
    await saveEngineState(state);
    await addLog(europe?.error ? "❌ Europe en échec" : "✅ Prévisions Europe terminées");

    // USA
    await addLog("➡️ Exécution USA…");
    const usa = await runGlobalUSA();
    state.checkup.usa = usa?.error ? "FAIL" : "OK";
    await saveEngineState(state);
    await addLog(usa?.error ? "❌ USA en échec" : "✅ Prévisions USA terminées");

    // Fin RUN
    state.status = "OK";
    state.checkup.models = "OK";
    state.checkup.engineStatus = "OK";
    await saveEngineState(state);

    await addLog("🚀 RUN GLOBAL terminé avec succès");
    return { success: true, europe, usa };
  } catch (err) {
    state.status = "FAIL";
    state.checkup.engineStatus = "FAIL";
    await saveEngineState(state);

    await addLog("💥 Erreur RUN GLOBAL: " + err.message);
    return { success: false, error: err.message };
  }
}
