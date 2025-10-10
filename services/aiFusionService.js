// ==========================================================
// ⚙️ TINSFLASH – aiFusionService.js
// Everest Protocol v3.9 PRO+++
// ==========================================================
// Fusion des modèles IA physiques et neuronaux J.E.A.N.
// ==========================================================

import { addEngineLog, addEngineError } from "./engineState.js";
import { injectAIProtocol } from "./aiInitProtocol.js";

export async function fuseModels(modelsData = {}, zone = "Europe") {
  try {
    await injectAIProtocol("fusion multi-modèles");
    const sources = Object.keys(modelsData);
    const fusion = {
      temperature: 0,
      precipitation: 0,
      wind: 0,
      reliability: 0,
      count: sources.length,
    };

    for (const src of sources) {
      const d = modelsData[src];
      if (!d) continue;
      fusion.temperature += d.temperature ?? 0;
      fusion.precipitation += d.precipitation ?? 0;
      fusion.wind += d.wind ?? 0;
      fusion.reliability += d.reliability ?? 0;
    }

    if (fusion.count > 0) {
      fusion.temperature /= fusion.count;
      fusion.precipitation /= fusion.count;
      fusion.wind /= fusion.count;
      fusion.reliability = Math.min(1, fusion.reliability / fusion.count);
    }

    await addEngineLog(
      `🧬 Fusion ${sources.length} modèles pour ${zone} – Fiabilité ${Math.round(fusion.reliability * 100)}%`,
      "info",
      "IA.JEAN"
    );

    return { ...fusion, zone, timestamp: new Date() };
  } catch (err) {
    await addEngineError(`Erreur fusion modèles IA : ${err.message}`, "IA.JEAN");
    return { error: err.message };
  }
}
