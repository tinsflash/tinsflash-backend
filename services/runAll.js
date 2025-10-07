// services/runAll.js
// 🚀 Lancement complet du moteur TINSFLASH (Europe + USA + Continental + World Alerts)

import { initEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { runGlobal } from "./runGlobal.js";
import { runContinental } from "./runContinental.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

console.log("==============================================");
console.log("🌋 DÉMARRAGE DU RUN COMPLET – CENTRALE TINSFLASH");
console.log("==============================================\n");

try {
  // 1️⃣ Connexion MongoDB et préparation du moteur
  await initEngineState();
  addEngineLog("⚙️ Initialisation moteur terminée.");

  // 2️⃣ Lancement du moteur principal (zones couvertes)
  addEngineLog("🌍 Lancement du runGlobal (zones couvertes)...");
  const globalResult = await runGlobal();
  addEngineLog(`✅ runGlobal terminé avec ${globalResult?.summary?.zones || "?"} zones.`);

  // 3️⃣ Lancement du fallback continental (zones non couvertes)
  addEngineLog("🌐 Lancement du runContinental (fallback open-data)...");
  const continentalResult = await runContinental();
  addEngineLog(`✅ runContinental terminé (${continentalResult?.summary?.points || 0} points traités).`);

  // 4️⃣ Fusion mondiale des alertes
  addEngineLog("🌎 Fusion mondiale des alertes (runWorldAlerts)...");
  const worldResult = await runWorldAlerts();
  addEngineLog(`✅ Fusion mondiale terminée (${worldResult?.summary?.totalAlerts || 0} alertes globales).`);

  // 5️⃣ Finalisation
  addEngineLog("🏁 RUN COMPLET TINSFLASH TERMINÉ AVEC SUCCÈS !");
  console.log("\n✅ RUN COMPLET TERMINÉ AVEC SUCCÈS\n");

  const state = { status: "ok", lastRun: new Date() };
  await saveEngineState(state);

  process.exit(0);
} catch (err) {
  console.error("❌ ERREUR RUN COMPLET :", err);
  addEngineError("❌ ERREUR RUN COMPLET : " + err.message);
  await saveEngineState({ status: "fail" });
  process.exit(1);
}
