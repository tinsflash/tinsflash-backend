// ============================================================
// 🌍 TINSFLASH – runGlobal.js
// ============================================================
// Lance la fusion globale via superForecast()
// ============================================================

import { superForecast } from "./superForecast.js";

export async function runGlobal() {
  console.log("[TINSFLASH] 🌍 runGlobal launched");

  try {
    const result = await superForecast({
      zones: ["EU", "USA", "WORLD"],
      runType: "global",
    });

    console.log(
      `[TINSFLASH] 🌐 RunGlobal success – Reliability: ${Math.round(
        result.reliability * 100
      )}%`
    );

    return result;
  } catch (err) {
    console.error("[TINSFLASH] ❌ RunGlobal failed:", err);
    throw err;
  }
}

// Auto-lancement si exécuté directement
if (process.argv[1].includes("runGlobal.js")) {
  runGlobal().then(() => {
    console.log("[TINSFLASH] 🏁 Global run complete");
    process.exit(0);
  });
}
