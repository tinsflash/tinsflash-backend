// ==========================================================
// 🌍 TINSFLASH – runGlobal.js (Everest Protocol v2.6 PRO++)
// ==========================================================
// Zones couvertes = prévisions moteur TINSFLASH IA J.E.A.N.
// Zones non couvertes = fallback Open-Data appoint uniquement
// Alertes = 100 % moteur interne
// ==========================================================

import { superForecast } from "./superForecast.js";
import { saveEngineState, addEngineLog, addEngineError } from "./engineState.js";

export async function runGlobal(zone = "All") {
  console.log(`[TINSFLASH] 🌍 runGlobal launched for ${zone}`);

  try {
    const result = await superForecast({
      zones: zone === "All" ? ["EU", "USA", "WORLD"] : [zone],
      runType: "global",
    });

    await saveEngineState({
      status: "ok",
      lastRun: new Date(),
      checkup: { engineStatus: "OK", zone },
    });

    await addEngineLog(
      `✅ Mise à jour état moteur après runGlobal (${zone})`,
      "success",
      "core"
    );

    console.log(
      `[TINSFLASH] 🌐 runGlobal success – Reliability: ${Math.round(
        result.reliability * 100
      )}%`
    );
    return result;
  } catch (err) {
    await addEngineError(`❌ runGlobal failed: ${err.message}`, "runGlobal");
    throw err;
  }
}

if (process.argv[1].includes("runGlobal.js")) {
  runGlobal().then(() => {
    console.log("[TINSFLASH] 🏁 Global run complete");
    process.exit(0);
  });
}
