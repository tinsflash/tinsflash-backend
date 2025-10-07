// services/localFactors.js
// 🌍 Ajustement des prévisions selon les facteurs locaux (relief, mer, climat urbain, etc.)

import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * Ajuste les prévisions météo selon des facteurs locaux :
 * - relief
 * - proximité de la mer
 * - climat urbain
 * - anomalies régionales (à enrichir)
 */
export function adjustWithLocalFactors(forecast, region = "GENERIC") {
  try {
    if (!forecast) {
      addEngineError("❌ Aucun forecast fourni à adjustWithLocalFactors");
      return forecast;
    }

    // ===============================
    // 🏔️ Relief
    // ===============================
    if (forecast.elevation && forecast.elevation > 500) {
      forecast.temperature_min = (forecast.temperature_min || 0) - 1.5;
      forecast.temperature_max = (forecast.temperature_max || 0) - 1.5;
      forecast.reliability = (forecast.reliability || 80) + 1;
      addEngineLog(`🏔️ Ajustement relief appliqué (${forecast.elevation} m)`);
    }

    // ===============================
    // 🌊 Proximité océanique
    // ===============================
    if (forecast.lon && forecast.lon > -10 && forecast.lon < 15) {
      forecast.humidity = (forecast.humidity || 60) + 5;
      forecast.reliability = (forecast.reliability || 80) + 2;
      addEngineLog("🌊 Influence océanique appliquée");
    }

    // ===============================
    // 🏙️ Climat urbain
    // ===============================
    if (region && (region.includes("City") || region.includes("Capital") || region.includes("Metropole"))) {
      forecast.temperature_max = (forecast.temperature_max || 0) + 0.5;
      forecast.reliability = (forecast.reliability || 80) + 1;
      addEngineLog(`🏙️ Ajustement climat urbain (${region}) appliqué`);
    }

    // ===============================
    // 🌦️ Ajustement de cohérence générale
    // ===============================
    if (forecast.temperature_max < forecast.temperature_min) {
      const mid = (forecast.temperature_min + forecast.temperature_max) / 2;
      forecast.temperature_min = mid - 1;
      forecast.temperature_max = mid + 1;
      addEngineLog("⚙️ Correction de cohérence température appliquée");
    }

    addEngineLog("✅ Facteurs locaux appliqués avec succès");
    return forecast;

  } catch (err) {
    addEngineError(`💥 Erreur adjustWithLocalFactors : ${err.message}`);
    return forecast;
  }
}
// ✅ Double export — compatibilité totale avec Node ESM et imports nommés
export { applyClimateFactors };
export default { applyClimateFactors };

