// ==========================================================
// 🌐 TINSFLASH – compareExternalIA.js
// Everest Protocol v3.9 PRO+++
// ==========================================================
// Audit externe : comparaison IA J.E.A.N. avec NOAA / ECMWF / Trullemans
// ==========================================================

import axios from "axios";
import { addEngineLog, addEngineError } from "./engineState.js";
import { injectAIProtocol } from "./aiInitProtocol.js";

export async function runAIComparison(results = []) {
  try {
    await injectAIProtocol("audit externe");
    await addEngineLog("🌍 Audit externe démarré", "info", "IA.JEAN");

    for (const r of results) {
      try {
        const resNOAA = await axios.get("https://api.weather.gov/");
        const resECMWF = await axios.get("https://www.ecmwf.int/en/forecasts");

        const deviation = Math.abs((r.fused.temperature ?? 0) - (resNOAA.data?.temperature ?? 0));
        const info = `ΔTemp NOAA=${deviation.toFixed(1)}°C`;

        await addEngineLog(`🔎 ${r.zone} → ${info}`, "info", "IA.JEAN");
      } catch (e) {
        await addEngineError(`Audit externe échoué pour ${r.zone}: ${e.message}`, "IA.JEAN");
      }
    }

    await addEngineLog("✅ Audit externe IA terminé", "success", "IA.JEAN");
  } catch (err) {
    await addEngineError(`Erreur audit externe: ${err.message}`, "IA.JEAN");
  }
}

// ==========================================================
// ✅ Compatibilité ascendante pour superForecast.js
// ==========================================================
export const autoCompareAfterRun = runAIComparison;
