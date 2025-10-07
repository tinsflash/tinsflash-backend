// PATH: services/aiAnalysis.js
// 🧠 Analyse IA J.E.A.N – Fusion finale GPT-5

import { askOpenAI } from "./openaiService.js";
import { getEngineState, saveEngineState, addEngineLog } from "./engineState.js";

export async function runAIAnalysis() {
  await addEngineLog("🧠 Démarrage de l’analyse IA J.E.A.N (GPT-5)...");
  const state = await getEngineState();
  const context = {
    status: state.status,
    checkup: state.checkup,
    lastRun: state.lastRun,
    alerts: state.alertsLocal || [],
  };

  const system = `
Tu es ChatGPT-5, moteur d'analyse météorologique TINSFLASH.
Ta mission : interpréter les résultats de prévision et générer un résumé global clair, avec fiabilité (%).
Réponds toujours en français, de manière concise, scientifique et lisible.
`;

  const user = `
[Contexte]
${JSON.stringify(context, null, 2)}

[Instructions]
- Identifie les anomalies météo et alertes critiques.
- Calcule une fiabilité pour chaque source.
- Résume les grandes tendances continentales.
`;

  const ai = await askOpenAI(system, user, { model: "gpt-5" });
  state.analysis = ai;
  state.lastAIAnalysis = new Date();
  await saveEngineState(state);
  await addEngineLog("✅ Analyse IA J.E.A.N terminée avec succès.");
  return { success: true, reply: ai };
}
