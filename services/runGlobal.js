// ==========================================================
// 🌍 TINSFLASH – runGlobal.js (Everest Protocol v2.6 PRO++)
// ==========================================================

import { getEngineState, saveEngineState, addEngineLog, addEngineError } from "./engineState.js";
import { superForecast } from "./superForecast.js";
import { applyLocalFactors } from "./localFactors.js";
import { applyClimateFactors } from "./climateFactors.js";
import { enumerateCoveredPoints } from "./zonesCovered.js";

/**
 * Exécute la phase 1 : extraction, calculs multi-modèles et stockage des prévisions
 * @param {string} zone - "All" par défaut
 */
export async function runGlobal(zone = "All") {
  await addEngineLog(`🌐 Lancement runGlobal pour ${zone}`, "info", "runGlobal");
  try {
    const state = await getEngineState();
    const covered = enumerateCoveredPoints();
    const allForecasts = [];

    // 1️⃣ Extraction par zones couvertes
    for (const pt of covered) {
      try {
        const raw = await superForecast(pt.lat, pt.lon, pt.country);
        let corrected = await applyLocalFactors(raw, pt.lat, pt.lon, pt.country);
        corrected = await applyClimateFactors(corrected, pt.lat, pt.lon, pt.country);
        allForecasts.push({
          ...corrected,
          lat: pt.lat,
          lon: pt.lon,
          country: pt.country,
          region: pt.region || "",
        });
      } catch (err) {
        await addEngineError(`❌ Erreur sur ${pt.country} (${pt.lat},${pt.lon}) : ${err.message}`);
      }
    }

    // 2️⃣ Sauvegarde dans le moteur pour IA.J.E.A.N
    state.partialReport = allForecasts;
    state.forecasts = allForecasts;
    state.lastRun = new Date();
    state.status = "ok";
    state.checkup = state.checkup || {};
    state.checkup.engineStatus = "OK";
    await saveEngineState(state);

    await addEngineLog(
      `🧩 ${allForecasts.length} prévisions stockées pour IA J.E.A.N.`,
      "success",
      "runGlobal"
    );

    return { success: true, forecasts: allForecasts.length };
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
