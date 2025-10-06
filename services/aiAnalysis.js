// PATH: services/aiAnalysis.js
// 🤖 Étape 2 – IA J.E.A.N : lit partialReport + geo/local factors et produit finalReport

import { getEngineState, saveEngineState } from "./engineState.js";
import * as adminLogs from "./adminLogs.js";
import { askOpenAI } from "./openaiService.js";
import { applyGeoFactors } from "./geoFactors.js";          // ✅ Import nommé
import { adjustWithLocalFactors } from "./localFactors.js"; // ✅ Import nommé

export async function runAIAnalysis() {
  const state = await getEngineState();
  if (!state?.partialReport) {
    await adminLogs.addError("❌ IA: partialReport introuvable. Lance d'abord l’extraction.");
    return { success: false, error: "partialReport introuvable" };
  }

  await adminLogs.addLog("🧠 Lancement Analyse IA J.E.A.N (relief/altitude intégrés)...");

  // 🌍 Intégration terrain avant analyse IA
  if (state.alertsLocal && state.alertsLocal.length > 0) {
    for (const a of state.alertsLocal) {
      if (a.lat && a.lon) {
        try {
          // ✅ Ajustement topographique et microclimatique
          a.forecast = await applyGeoFactors(a.forecast || {}, a.lat, a.lon);
          a.forecast = adjustWithLocalFactors(a.forecast, a.region || "GENERIC");
        } catch (err) {
          await adminLogs.addError(`⚠️ Facteurs terrain échoués sur ${a.region || "inconnu"}: ${err.message}`);
        }
      }
    }
  }

  // 🧩 Construction du prompt IA
  const input = {
    partialReport: state.partialReport,
    alertsLocalSample: (state.alertsLocal || []).slice(0, 200),
    alertsContinentalSample: (state.alertsContinental || []).slice(0, 200),
    worldSample: (state.alertsWorld || []).slice(0, 200),
    meta: { note: "Utiliser relief, altitude, exposition, océans, continent, anomalies saisonnières." }
  };

  const system = `
Tu es J.E.A.N., météorologue IA de TINSFLASH.
RÈGLES :
- Analyse exclusivement les EXTRACTIONS RÉELLES (aucune invention).
- Intègre impérativement : relief, altitude, exposition, océans, continentalité, anomalies saisonnières.
- Fournis par PAYS COUVERT : synthèse, risques majeurs, intensité, confiance (0–100), recommandations pratiques.
- Déduis et structure aussi les alertes continentales correspondantes.
- Réponds UNIQUEMENT en JSON VALIDE.
`;

  const user = JSON.stringify(input);

  try {
    const ai = await askOpenAI(system, user); // GPT-5 J.E.A.N.
    let finalReport;
    try {
      finalReport = JSON.parse(ai);
    } catch {
      finalReport = { raw: ai, note: "⚠️ JSON non parsé (fourni brut par le modèle)" };
    }

    // ✅ Sauvegarde moteur
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
