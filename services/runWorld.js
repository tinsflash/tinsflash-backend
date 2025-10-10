// ==========================================================
// 🌎 RUN MONDIAL – Reste du monde (1×/jour)
// TINSFLASH PRO+++ (Everest Protocol v3.1)
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

// ==========================================================
// 🧭 DÉBUT DU RUN MONDIAL
// ==========================================================
console.log("==================================================");
console.log("🌋 RUN MONDIAL – RESTE DU MONDE (TINSFLASH PRO+++) ");
console.log("==================================================\n");

try {
  await initEngineState();
  await addEngineLog("🌎 Initialisation moteur mondial – OK", "info", "runWorld");

  // ======================================================
  // 1️⃣ Lancement parallèle de toutes les sous-régions
  // ======================================================
  await addEngineLog("🧩 Déploiement multi-continental en parallèle...", "info", "runWorld");

  const runs
