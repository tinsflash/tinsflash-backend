// ==========================================================
// 🌎 RUN MONDIAL – Reste du monde (1×/jour)
// TINSFLASH PRO+++ (Everest Protocol v3.0)
// ==========================================================

import {
  initEngineState,
  addEngineLog,
  addEngineError,
  saveEngineState,
} from "./engineState.js";

import { runGlobalAfricaNord } from "./runGlobalAfricaNord.js";
import { runGlobalAfricaCentrale } from "./runGlobalAfricaCentrale.js";
import { runGlobalAfricaOuest } from "./runGlobalAfricaOuest.js";
import { runGlobalAfricaSud } from "./runGlobalAfricaSud.js";
import { runGlobalAfricaEst } from "./runGlobalAfricaEst.js";
import { runGlobalAmericaSud } from "./runGlobalAmericaSud.js";
import { runGlobalAsiaEst } from "./runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./runGlobalAsiaSud.js";
import { runGlobalOceania } from "./runGlobalOceania.js";
import { runGlobalCaribbean } from "./runGlobalCaribbean.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

console.log("==================================================");
console.log("🌋 RUN MONDIAL – RESTE DU MONDE (TINSFLASH PRO+++) ");
console.log("==================================================\n");

try {
  await initEngineState();
  await addEngineLog("🌎 Initialisation moteur mondial – OK", "info", "runWorld");

  // === Étape 1 : Lancement parallèle des sous-continents ===
  await addEngineLog("🧩 Déploiement multi-continental en parallèle...", "info", "runWorld");

  const runs = await Promise.allSettled([
    runGlobalAfricaNord(),
    runGlobalAfricaCentrale(),
    runGlobalAfricaOuest(),
    runGlobalAfricaSud(),
    runGlobalAfricaEst(),
    runGlobalAmericaSud(),
    runGlobalAsiaEst(),
    runGlobalAsiaSud(),
    runGlobalOceania(),
    runGlobalCaribbean(),
  ]);

  const ok = runs.filter(r => r.status === "fulfilled").length;
  const failed = runs.length - ok;

  await addEngineLog(`✅ ${ok} régions terminées | ⚠️ ${failed} échec(s) potentiel(s)`, "success", "runWorld");

  // === Étape 2 : Fusion mondiale des alertes ===
  await addEngineLog("⚡ Fusion mondiale des alertes via runWorldAlerts()", "info", "runWorld");
  const alerts = await runWorldAlerts();

  await addEngineLog(`📡 ${alerts?.summary?.totalAlerts || 0} alertes consolidées`, "success", "runWorld");

  // === Étape 3 : Sauvegarde état moteur ===
  const state = { status: "ok", lastRun: new Date(), type: "world" };
  await saveEngineState(state);

  await addEngineLog("🌍 RUN MONDIAL TERMINÉ AVEC SUCCÈS ✅", "success", "runWorld");
  console.log("\n✅ RUN MONDIAL TERMINÉ AVEC SUCCÈS\n");
  process.exit(0);

} catch (err) {
  console.error("❌ ERREUR RUN MONDIAL :", err);
  await addEngineError("❌ ERREUR RUN MONDIAL : " + err.message, "runWorld");
  await saveEngineState({ status: "fail", type: "world" });
  process.exit(1);
}
