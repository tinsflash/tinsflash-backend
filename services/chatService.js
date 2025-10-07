// PATH: services/chatService.js
import { askOpenAI } from "./openaiService.js";
import { askCohere } from "./cohereService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";

// =====================================================
// 💬 Chat moteur (GPT-5)
// =====================================================
export async function askAIEngine(message = "") {
  try {
    const state = await getEngineState();
    const logs = await getLogs();
    const context = {
      checkup: state?.checkup || {},
      lastRun: state?.lastRun,
      alerts: state?.alertsLocal || [],
      logs: logs?.slice(-200) || [],
    };

    const SYSTEM = `
Tu es ChatGPT-5, cerveau du moteur TINSFLASH.
Analyse uniquement les données réelles.
Réponds en français, de manière concise et technique.
`;

    const prompt = `
[QUESTION]
${message}

[CONTEXTE]
${JSON.stringify(context, null, 2)}
`;
    return await askOpenAI(SYSTEM, prompt, { model: "gpt-5" });
  } catch (err) {
    console.error("❌ askAIEngine error:", err.message);
    return "Erreur IA moteur (GPT-5).";
  }
}

// =====================================================
// 💬 Chat console admin (GPT-4o-mini)
// =====================================================
export async function askAIAdmin(message = "", mode = "moteur") {
  try {
    const SYSTEM = `
Tu es un assistant technique TINSFLASH basé sur GPT-4o-mini.
Aide Patrick à interpréter les prévisions, les alertes et l’état du moteur.
Réponds en français, clair, professionnel et opérationnel.
`;

    const prefix =
      mode === "meteo"
        ? "Analyse météo / climat demandée :"
        : "Demande liée au moteur ou à la console :";

    const prompt = `${prefix}\n${message}`;
    return await askOpenAI(SYSTEM, prompt, { model: "gpt-4o-mini" });
  } catch (err) {
    console.error("❌ askAIAdmin error:", err.message);
    return "Erreur IA admin (GPT-4o-mini).";
  }
}

// =====================================================
// 💬 Chat public (Cohere)
// =====================================================
export async function askAIGeneral(message = "") {
  try {
    const { reply } = await askCohere(message);
    return reply || "Réponse IA indisponible (Cohere).";
  } catch (err) {
    console.error("❌ askAIGeneral error:", err.message);
    return "Erreur IA publique (Cohere).";
  }
}

export default { askAIEngine, askAIAdmin, askAIGeneral };
