// ==========================================================
// 🌎 TINSFLASH – runWorld.js (Everest Protocol v3.6 PRO+++)
// ==========================================================
// ✅ PHASE 1 – Extraction pure (Afrique, Asie, Amérique Sud, Océanie, Moyen-Orient)
// Aucune IA J.E.A.N. utilisée ici – uniquement pompage réel des modèles
// 100 % connecté à zonesCovered.js et superForecast.js
// ==========================================================

import { enumerateCoveredPoints } from "./zonesCovered.js";
import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError, updateEngineState } from "./engineState.js";

// ==========================================================
// 🚀 Fonction principale – Extraction globale hors Europe/USA/Canada
// ==========================================================
export async function runWorld() {
  try {
    await addEngineLog("🌎 Démarrage runWorld (autres continents)", "info", "runWorld");

    // Chargement des zones mondiales
    const allZones = enumerateCoveredPoints();
    if (!allZones?.length) throw new Error("Aucune zone détectée dans zonesCovered.js");

    // Sélection des zones non européennes / non américaines
    const worldZones = allZones.filter(
      (z) => !["Europe", "USA", "Canada"].includes(z.continent)
    );

    console.log(`🌍 ${worldZones.length} zones hors Europe/USA/Canada détectées`);

    // Exécution du SuperForecast – phase 1 pure
    const result = await superForecast({
      zones: worldZones,
      runType: "World",
    });

    // Mise à jour état moteur
    await updateEngineState({
      status: "ok",
      lastRun: new Date(),
      checkup: {
        engineStatus: "RUN_OK",
        lastFilter: "World",
        zonesCount: worldZones.length,
      },
    });

    await addEngineLog(
      `✅ runWorld terminé (${worldZones.length} zones traitées)`,
      "success",
      "runWorld"
    );

    return result;
  } catch (err) {
    await addEngineError(`Erreur runWorld : ${err.message}`, "runWorld");
    console.error(`❌ runWorld : ${err.message}`);
    return { error: err.message };
  }
}

// ==========================================================
// 🌍 Fonction utilitaire – extraction régionale ciblée
// ==========================================================
export async function runAfrica() {
  const all = enumerateCoveredPoints();
  const africa = all.filter((z) => z.continent === "Africa");
  return superForecast({ zones: africa, runType: "Africa" });
}

export async function runAsia() {
  const all = enumerateCoveredPoints();
  const asia = all.filter((z) => z.continent === "Asia");
  return superForecast({ zones: asia, runType: "Asia" });
}

export async function runSouthAmerica() {
  const all = enumerateCoveredPoints();
  const south = all.filter((z) => z.continent === "South America");
  return superForecast({ zones: south, runType: "SouthAmerica" });
}

export async function runOceania() {
  const all = enumerateCoveredPoints();
  const oceania = all.filter((z) => z.continent === "Oceania");
  return superForecast({ zones: oceania, runType: "Oceania" });
}

export async function runMiddleEast() {
  const all = enumerateCoveredPoints();
  const me = all.filter((z) => z.continent === "Middle East");
  return superForecast({ zones: me, runType: "MiddleEast" });
}

// ==========================================================
// Fin du module – 100 % réel, stable Render
// ==========================================================
