// ==========================================================
// 🌍 TINSFLASH – runGlobal.js (Everest Protocol v2.8 PRO+++)
// ==========================================================
// Extraction multi-zones – 100 % réel – compatible IA.J.E.A.N.
// Gestion stop flag + multi-runs Europe/USA/Canada vs Monde
// ==========================================================

import {
  getEngineState,
  saveEngineState,
  addEngineLog,
  addEngineError,
  isExtractionStopped,
} from "./engineState.js";
import { superForecast } from "./superForecast.js";
import { applyLocalFactors } from "./localFactors.js";
import { applyClimateFactors } from "./climateFactors.js";
import { enumerateCoveredPoints } from "./zonesCovered.js";

/**
 * Exécute la phase 1 : extraction et stockage des prévisions multi-modèles
 * @param {string} zone - "All" | "EuropeUSA" | "World"
 */
export async function runGlobal(zone = "All") {
  const startTime = Date.now();
  await addEngineLog(`🌐 Lancement runGlobal pour ${zone}`, "info", "runGlobal");

  try {
    const state = await getEngineState();
    const covered = enumerateCoveredPoints(zone);
    const allForecasts = [];
    let processed = 0;

    if (!covered.length) {
      await addEngineError(`Aucune coordonnée trouvée pour la zone ${zone}`, "runGlobal");
      return { success: false, error: "Pas de points d’extraction" };
    }

    // 1️⃣ Extraction par points couverts
    for (const pt of covered) {
      if (isExtractionStopped()) {
        await addEngineLog(`🛑 Extraction arrêtée manuellement`, "warning", "runGlobal");
        break;
      }

      try {
        const raw = await superForecast({
          zones: [pt.zone || pt.country || "Unknown"],
          runType: zone,
        });

        let corrected = await applyLocalFactors(raw, pt.lat, pt.lon, pt.country);
        corrected = await applyClimateFactors(corrected, pt.lat, pt.lon, pt.country);

        allForecasts.push({
          ...corrected,
          lat: pt.lat,
          lon: pt.lon,
          country: pt.country,
          region: pt.region || "",
        });

        processed++;
        if (processed % 10 === 0)
          await addEngineLog(`📡 ${processed}/${covered.length} points traités`, "info", "runGlobal");
      } catch (err) {
        await addEngineError(`❌ Erreur ${pt.country} (${pt.lat},${pt.lon}) : ${err.message}`, "runGlobal");
      }
    }

    // 2️⃣ Sauvegarde état moteur
    state.partialReport = allForecasts;
    state.forecasts = allForecasts;
    state.lastRun = new Date();
    state.status = "ok";
    state.checkup = state.checkup || {};
    state.checkup.engineStatus = "OK";

    await saveEngineState(state);

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    await addEngineLog(
      `✅ Extraction terminée (${processed}/${covered.length} points) – durée ${duration} min`,
      "success",
      "runGlobal"
    );

    return { success: true, forecasts: processed, duration };
  } catch (err) {
    await addEngineError(`Erreur runGlobal : ${err.message}`, "runGlobal");
    const s = await getEngineState();
    s.status = "fail";
    s.checkup = s.checkup || {};
    s.checkup.engineStatus = "FAIL";
    await saveEngineState(s);
    return { success: false, error: err.message };
  }
}
