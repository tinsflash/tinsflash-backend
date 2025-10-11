// ==========================================================
// 🌐 TINSFLASH – runAll.js (Everest Protocol v3.6 PRO+++)
// ==========================================================
// ✅ PHASE 1 – Extraction complète du globe
// Combinaison de toutes les zones (Europe, USA, Canada, Afrique,
// Asie, Amérique Sud, Océanie, Moyen-Orient)
// Aucune IA J.E.A.N. ici : extraction pure via superForecast
// ==========================================================

import { enumerateCoveredPoints } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

// ==========================================================
// 🚀 Fonction principale – extraction mondiale totale
// ==========================================================
export async function runAll() {
  try {
    await addEngineLog("🌐 Démarrage runAll (extraction globale complète)", "info", "runAll");

    // Récupération des zones couvertes
    const zones = enumerateCoveredPoints();
    if (!zones?.length) throw new Error("Aucune zone détectée dans zonesCovered.js");

    console.log(`🗺️ ${zones.length} zones totales détectées – lancement extraction mondiale`);

    // Exécution du SuperForecast (phase 1 pure)
    const result = await superForecast({
      zones,
      runType: "Global",
    });

    // Mise à jour de l’état moteur
    await updateEngineState({
      status: "ok",
      lastRun: new Date(),
      checkup: {
        engineStatus: "RUN_OK",
        lastFilter: "Global",
        zonesCount: zones.length,
      },
    });

    await addEngineLog(`✅ runAll terminé (${zones.length} zones traitées)`, "success", "runAll");
    return result;
  } catch (err) {
    await addEngineError(`Erreur runAll : ${err.message}`, "runAll");
    console.error(`❌ runAll : ${err.message}`);
    return { error: err.message };
  }
}

// ==========================================================
// ⚙️ Sous-modules d’extraction régionale (utiles pour console admin)
// ==========================================================
export async function runNorthernHemisphere() {
  const all = enumerateCoveredPoints();
  const nh = all.filter((z) => z.lat > 0);
  return superForecast({ zones: nh, runType: "North" });
}

export async function runSouthernHemisphere() {
  const all = enumerateCoveredPoints();
  const sh = all.filter((z) => z.lat < 0);
  return superForecast({ zones: sh, runType: "South" });
}

export async function runEquatorial() {
  const all = enumerateCoveredPoints();
  const eq = all.filter((z) => Math.abs(z.lat) < 10);
  return superForecast({ zones: eq, runType: "Equatorial" });
}

// ==========================================================
// Fin du module – 100 % réel, stable Render
// ==========================================================
