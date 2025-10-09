// PATH: services/runMain.js
// 🚀 RUN PRINCIPAL TINSFLASH – Europe + USA + Canada (2×/jour)
// ==========================================================
// Couvre les régions principales : Europe, États-Unis et Canada
// Exécution haute fréquence : 2 à 3 fois par jour
// ==========================================================

import {
  initEngineState,
  addEngineLog,
  addEngineError,
  saveEngineState,
} from "./engineState.js";

import { runGlobalEurope } from "./runGlobalEurope.js";
import { runGlobalUSA } from "./runGlobalUSA.js";
import { runGlobalCanada } from "./runGlobalCanada.js";
import { runWorldAlerts } from "./runWorldAlerts.js";

console.log("==================================================");
console.log("🌋 RUN PRINCIPAL – EUROPE + USA + CANADA (TINSFLASH)");
console.log("==================================================\n");

try {
  // ======================================================
  // 1️⃣ Initialisation du moteur et connexion MongoDB
  // ======================================================
  await initEngineState();
  await addEngineLog("⚙️ Initialisation moteur principale terminée.", "info", "runMain");

  // ======================================================
  // 2️⃣ Lancement des zones principales
  // ======================================================
  await addEngineLog("🌍 Lancement Europe (runGlobalEurope)...", "info", "runMain");
  const europe = await runGlobalEurope();
  await addEngineLog(`✅ Europe terminée (${europe?.forecastCount || 0} prévisions)`, "success", "runMain");

  await addEngineLog("🌎 Lancement USA (runGlobalUSA)...", "info", "runMain");
  const usa = await runGlobalUSA();
  await addEngineLog(`✅ USA terminé (${usa?.forecastCount || 0} prévisions)`, "success", "runMain");

  await addEngineLog("🇨🇦 Lancement Canada (runGlobalCanada)...", "info", "runMain");
  const canada = await runGlobalCanada();
  await addEngineLog(`✅ Canada terminé (${canada?.forecastCount || 0} prévisions)`, "success", "runMain");

  // ======================================================
  // 3️⃣ Fusion et validation des alertes régionales
  // ======================================================
  await addEngineLog("🛰️ Fusion des alertes régionales (Europe + USA + Canada)...", "info", "runMain");
  const alerts = await runWorldAlerts();
  await addEngineLog(`📡 ${alerts?.summary?.totalAlerts || 0} alertes intégrées.`, "success", "runMain");

  // ======================================================
  // 4️⃣ Finalisation
  // ======================================================
  await addEngineLog("🏁 RUN PRINCIPAL TERMINÉ AVEC SUCCÈS ✅", "success", "runMain");
  await saveEngineState({
    status: "ok",
    lastRun: new Date(),
    type: "main",
  });

  console.log("\n✅ RUN PRINCIPAL TERMINÉ AVEC SUCCÈS\n");
  process.exit(0);
} catch (err) {
  console.error("❌ ERREUR RUN PRINCIPAL :", err);
  await addEngineError("❌ ERREUR RUN PRINCIPAL : " + err.message, "runMain");
  await saveEngineState({ status: "fail", type: "main" });
  process.exit(1);
}
