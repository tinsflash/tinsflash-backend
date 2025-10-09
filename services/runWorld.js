// PATH: services/runWorld.js
// 🌍 RUN MONDIAL TINSFLASH – Reste du monde (1x/jour)
// ==========================================================
// Exécute toutes les zones hors Europe, USA et Canada.
// Compatible Render / MongoDB / IA.J.E.A.N (Everest Protocol v2.8 PRO+++)
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
import { runGlobalAmericaSud } from "./runGlobalAmericaSud.js";
import { runGlobalAsiaEst } from "./runGlobalAsiaEst.js";
import { runGlobalAsiaSud } from "./runGlobalAsiaSud.js";
import { runGlobalOceania } from "./runGlobalOceania.js";
import { runGlobalCaribbean } from "./runGlobalCaribbean.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

// ==========================================================
// 🧠 Lancement du run mondial
// ==========================================================
console.log("==================================================");
console.log("🌋 RUN MONDIAL – RESTE DU MONDE (TINSFLASH PRO+++)");
console.log("==================================================\n");

try {
  await initEngineState();
  await addEngineLog("🌎 Initialisation du moteur mondial terminée (runWorld.js)", "info", "runWorld");

  // ======================================================
  // 1️⃣ Lancement parallèle de toutes les régions du monde
  // ======================================================
  await addEngineLog("🧩 Lancement des sous-régions (Afrique, Amérique Sud, Asie, Océanie, Caraïbes)...", "info", "runWorld");

  const runs = await Promise.allSettled([
    runGlobalAfricaNord(),
    runGlobalAfricaCentrale(),
    runGlobalAfricaOuest(),
    runGlobalAfricaSud(),
    runGlobalAmericaSud(),
    runGlobalAsiaEst(),
    runGlobalAsiaSud(),
    runGlobalOceania(),
    runGlobalCaribbean(),
  ]);

  const ok = runs.filter(r => r.status === "fulfilled").length;
  const failed = runs.filter(r => r.status !== "fulfilled").length;

  await addEngineLog(`✅ ${ok} sous-régions exécutées avec succès, ${failed} échecs éventuels`, "success", "runWorld");

  // ======================================================
  // 2️⃣ Fusion mondiale des alertes
  // ======================================================
  await addEngineLog("⚡ Fusion mondiale des alertes (runWorldAlerts)...", "info", "runWorld");
  const alerts = await runWorldAlerts();

  await addEngineLog(
    `📡 ${alerts?.summary?.totalAlerts || 0} alertes globales intégrées.`,
    "success",
    "runWorld"
  );

  // ======================================================
  // 3️⃣ Finalisation et sauvegarde état moteur
  // ======================================================
  const state = {
    status: "ok",
    lastRun: new Date(),
    type: "world",
  };

  await saveEngineState(state);
  await addEngineLog("🌍 RUN MONDIAL TERMINÉ AVEC SUCCÈS ✅", "success", "runWorld");

  console.log("\n✅ RUN MONDIAL TERMINÉ AVEC SUCCÈS\n");
  process.exit(0);

} catch (err) {
  console.error("❌ ERREUR RUN MONDIAL :", err);
  await addEngineError(`❌ ERREUR RUN MONDIAL : ${err.message}`, "runWorld");
  await saveEngineState({ status: "fail", type: "world" });
  process.exit(1);
}
