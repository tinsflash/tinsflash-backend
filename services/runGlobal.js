// ==========================================================
// 🌍 TINSFLASH – runGlobal.js (Everest Protocol v3.6 PRO+++)
// ==========================================================
// ✅ PHASE 1 – Extraction pure (Europe + USA + Canada)
// Orchestration des zones couvertes via zonesCovered.js
// Aucun appel IA interne (J.E.A.N. désactivée ici)
// ==========================================================

import { enumerateCoveredPoints } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

// ==========================================================
// 🚀 Fonction principale – Extraction mondiale (zones couvertes principales)
// ==========================================================
export async function runGlobal(filter = "All") {
  try {
    await addEngineLog(`🌍 Démarrage runGlobal (${filter})`, "info", "runGlobal");

    // Liste de toutes les zones disponibles
    const allZones = enumerateCoveredPoints();
    if (!allZones?.length) throw new Error("Aucune zone disponible dans zonesCovered.js");

    // Filtrage éventuel
    let zones = allZones;
    if (filter === "Europe") zones = allZones.filter((z) => z.continent === "Europe");
    if (filter === "USA") zones = allZones.filter((z) => ["USA", "Canada"].includes(z.country));
    if (filter === "World") zones = allZones.filter((z) => !["Europe", "USA", "Canada"].includes(z.continent));

    console.log(`🗺️ ${zones.length} zones sélectionnées pour extraction (${filter})`);

    // Extraction via SuperForecast (phase 1 pure)
    const result = await superForecast({ zones, runType: filter });

    // Mise à jour état moteur
    await updateEngineState({
      status: "ok",
      lastRun: new Date(),
      checkup: { engineStatus: "RUN_OK", lastFilter: filter, zonesCount: zones.length },
    });

    await addEngineLog(`✅ runGlobal terminé (${zones.length} zones traitées)`, "success", "runGlobal");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runGlobal : ${err.message}`, "runGlobal");
    console.error(`❌ runGlobal : ${err.message}`);
    return { error: err.message };
  }
}

// ==========================================================
// 🌍 Fonction d’extraction rapide par région (Europe/USA)
// ==========================================================
export async function runEurope() {
  return runGlobal("Europe");
}

export async function runUSA() {
  return runGlobal("USA");
}

export async function runWorldOnly() {
  return runGlobal("World");
}

// ==========================================================
// Fin du module – 100 % réel, stable Render
// ==========================================================
