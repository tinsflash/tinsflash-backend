// services/localFactors.js
// 🌍 Ajustement des prévisions selon les facteurs locaux (relief, mer, climat urbain, etc.)

import { addEngineLog, addEngineError } from "./engineState.js";

export function adjustWithLocalFactors(forecast, region = "GENERIC") {
  try {
    if (!forecast) return forecast;

    // 🔹 Ajustement relief
    if (forecast.elevation && forecast.elevation > 500) {
      forecast.temperature_min -= 1.5;
      forecast.temperature_max -= 1.5;
      addEngineLog(`🏔️ Ajustement relief appliqué (${forecast.elevation} m)`);
    }

    // 🔹 Ajustement proximité mer
    if (forecast.lon > -10 && forecast.lon < 15) {
      forecast.humidity += 5;
      forecast.reliability += 2;
      addEngineLog("🌊 Influence océanique légère appliquée");
    }

    // 🔹 Ajustement climat urbain
    if (region.includes("City") || region.includes("Capital")) {
      forecast.temperature_max += 0.5;
      forecast.reliability += 1;
      addEngineLog("🏙️ Ajustement climat urbain appliqué");
    }

    return forecast;
  } catch (err) {
    addEngineError(`Erreur localFactors: ${err.message}`);
    return forecast;
  }
}

// ✅ Export explicite compatible Node.js et ESModule
export default { adjustWithLocalFactors };
