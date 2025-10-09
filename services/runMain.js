// 🚀 RUN PRINCIPAL TINSFLASH – Europe + USA (2×/jour)
import { initEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

console.log("==============================================");
console.log("🌋 RUN PRINCIPAL – EUROPE + USA (TINSFLASH)");
console.log("==============================================\n");

try {
  await initEngineState();
  addEngineLog("⚙️ Moteur initialisé (runMain.js)");

  addEngineLog("🌍 Lancement Europe (runGlobalEurope)...");
  const europe = await runGlobalEurope();
  addEngineLog(`✅ Europe terminée (${europe?.forecastCount || 0} prévisions)`);

  addEngineLog("🌎 Lancement USA (runGlobalUSA)...");
  const usa = await runGlobalUSA();
  addEngineLog(`✅ USA terminé (${usa?.forecastCount || 0} prévisions)`);

  addEngineLog("🛰️ Fusion des alertes régionales...");
  const alerts = await runWorldAlerts();
  addEngineLog(`✅ ${alerts?.summary?.totalAlerts || 0} alertes intégrées.`);

  addEngineLog("🏁 RUN PRINCIPAL TERMINÉ AVEC SUCCÈS ✅");
  await saveEngineState({ status: "ok", lastRun: new Date(), type: "main" });
  process.exit(0);
} catch (err) {
  console.error("❌ ERREUR RUN PRINCIPAL :", err);
  addEngineError("❌ ERREUR RUN PRINCIPAL : " + err.message);
  await saveEngineState({ status: "fail" });
  process.exit(1);
}
