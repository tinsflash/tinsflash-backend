// PATH: services/aiAnalysis.js
// 🤖 Étape 2 – IA J.E.A.N : lit partialReport + geo/local factors et produit finalReport

import { getEngineState, saveEngineState } from "./engineState.js";
import * as adminLogs from "./adminLogs.js";
import { askOpenAI } from "./openaiService.js";
import applyGeo from "./geoFactors.js";
import adjustWithLocalFactors from "./localFactors.js";

export async function runAIAnalysis() {
  const state = await getEngineState();
  if (!state?.partialReport) {
    await adminLogs.addError("❌ IA: partialReport introuvable. Lance d'abord l’extraction.");
    return { success: false, error: "partialReport introuvable" };
  }

  await adminLogs.addLog("🧠 Lancement Analyse IA J.E.A.N (relief/altitude intégrés)...");

  // Construire un input compact pour le prompt
  const input = {
    partialReport: state.partialReport,
    alertsLocalSample: (state.alertsLocal || []).slice(0, 200),       // limiter volume prompt
    alertsContinentalSample: (state.alertsContinental || []).slice(0, 200),
    worldSample: (state.alertsWorld || []).slice(0, 200),
    meta: { note: "Utiliser relief/altitude/océan. Sortie JSON strict." }
  };

  const system = `
Tu es J.E.A.N., météorologue IA de TINSFLASH.
RÈGLES:
- Analyse à partir des EXTRACTIONS RÉELLES fournies (pas d'invention).
- Intègre impérativement: relief, altitude, exposition montagnes, proximité océans/mer, continent vs océan, anomalies saisonnières.
- Donne par PAYS couvert: synthèse, risques majeurs, intensité, confiance (0-100), recommandations concrètes.
- Déduis les Alertes continentales cohérentes et leurs zones probables.
- Réponds STRICTEMENT en JSON valide.
`;

  const user = JSON.stringify(input);

  try {
    const ai = await askOpenAI(system, user); // GPT-5 derrière (clé requise ici)
    let finalReport;
    try {
      finalReport = JSON.parse(ai);
    } catch {
      finalReport = { raw: ai, note: "JSON non-parsé, fourni brut" };
    }

    state.finalReport = finalReport;
    state.status = "ok";
    state.checkup = state.checkup || {};
    state.checkup.engineStatus = "OK-ANALYZED";
    await saveEngineState(state);

    await adminLogs.addLog("✅ IA J.E.A.N terminée. Rapport final disponible.");
    return { success: true, finalReport };
  } catch (e) {
    await adminLogs.addError("⚠️ IA J.E.A.N erreur: " + e.message);
    return { success: false, error: e.message };
  }
}

export default { runAIAnalysis };
