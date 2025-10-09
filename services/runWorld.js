// 🌐 RUN MONDIAL TINSFLASH – Reste du monde (1×/jour)
import { initEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { runGlobalCanada } from "./runGlobalCanada.js";
import { runGlobalAfricaNord } from "./runGlobalAfricaNord.js";
import { runGlobalAfricaCentrale } from "./runGlobalAfricaCentrale.js";
import { runGlobalAfricaOuest } from "./runGlobalAfricaOuest.js";
import { runGlobalAfricaSud } from "./runGlobalAfricaSud.js";
import { runGlobalAmericaSud } from "./runGlobalAmericaSud.js";
import { runGlobalAsiaEst } from "./runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./runGlobalAsiaSud.js";
import { runGlobalOceania } from "./runGlobalOceania.js";
import { runGlobalCaribbean } from "./runGlobalCaribbean.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

console.log("==============================================");
console.log("🌍 RUN MONDIAL – RESTE DU MONDE (TINSFLASH)");
console.log("==============================================\n");

try {
  await initEngineState();
  addEngineLog("⚙️ Moteur initialisé (runWorld.js)");

  const runs = [
    runGlobalCanada(),
    runGlobalAfricaNord(),
    runGlobalAfricaCentrale(),
    runGlobalAfricaOuest(),
    runGlobalAfricaSud(),
    runGlobalAmericaSud(),
    runGlobalAsiaEst(),
    runGlobalAsiaSud(),
    runGlobalOceania(),
    runGlobalCaribbean(),
  ];

  const results = await Promise.allSettled(runs);
  const success = results.filter(r => r.status === "fulfilled").length;

  addEngineLog(`✅ ${success} sous-régions traitées avec succès`);

  addEngineLog("🛰️ Fusion des alertes mondiales...");
  const alerts = await runWorldAlerts();
  addEngineLog(`✅ ${alerts?.summary?.totalAlerts || 0} alertes intégrées.`);

  addEngineLog("🏁 RUN MONDIAL TERMINÉ AVEC SUCCÈS ✅");
  await saveEngineState({ status: "ok", lastRun: new Date(), type: "world" });
  process.exit(0);
} catch (err) {
  console.error("❌ ERREUR RUN MONDIAL :", err);
  addEngineError("❌ ERREUR RUN MONDIAL : " + err.message);
  await saveEngineState({ status: "fail" });
  process.exit(1);
}
