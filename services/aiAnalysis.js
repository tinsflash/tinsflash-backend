// ==========================================================
// 🧠 TINSFLASH – aiAnalysis.js
// Everest Protocol v3.9 PRO+++
// ==========================================================
// Analyse IA J.E.A.N. – fusion intelligente des données météorologiques
// ==========================================================

import { getEngineState, addEngineLog, addEngineError, saveEngineState } from "./engineState.js";
import { injectAIProtocol } from "./aiInitProtocol.js";
import { runAIComparison } from "./compareExternalIA.js";
import { fuseModels } from "./aiFusionService.js";

export async function runAIAnalysis() {
  const state = await getEngineState();
  try {
    const protocol = await injectAIProtocol("analyse globale");
    await addEngineLog(protocol, "info", "IA.JEAN");

    await addEngineLog("🧠 IA J.E.A.N. – Démarrage analyse multi-modèles", "info", "IA.JEAN");

    const zones = Object.keys(state.zones || {});
    const results = [];

    for (const zone of zones) {
      try {
        const modelsData = state.zones[zone]?.models || {};
        const fused = await fuseModels(modelsData, zone);
        results.push({ zone, fused });
        await addEngineLog(`✅ Fusion IA terminée pour ${zone}`, "success", "IA.JEAN");
      } catch (err) {
        await addEngineError(`Erreur fusion IA pour ${zone}: ${err.message}`, "IA.JEAN");
      }
    }

    await runAIComparison(results);
    await addEngineLog("📊 Comparaison IA externe terminée", "info", "IA.JEAN");

    state.lastAIAnalysis = new Date();
    await saveEngineState(state);

    await addEngineLog("✅ IA J.E.A.N. – Analyse complète réussie", "success", "IA.JEAN");
    return { success: true, results };
  } catch (err) {
    await addEngineError(`Erreur IA.JEAN analyse: ${err.message}`, "IA.JEAN");
    return { success: false, error: err.message };
  }
}
