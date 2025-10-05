// PATH: services/chatService.js
import { askOpenAI } from "./openaiService.js";
import { askCohere } from "./cohereService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";

/**
 * 🧠 Règle d’utilisation IA :
 * - ChatGPT-5 → moteur météo (analyses et prévisions)
 * - ChatGPT-3.5 → console admin (chat moteur + météo)
 * - Cohere → utilisateurs gratuits (J.E.A.N)
 */

/* ===========================================================
   💬 Chat moteur – IA principale (ChatGPT-5)
   =========================================================== */
export async function askAIEngine(message = "") {
  try {
    const state = await getEngineState();
    const logs = await getLogs();

    const context = {
      checkup: state?.checkup || {},
      lastRun: state?.runTime || state?.lastRun,
      zonesCovered: Object.keys(state?.zonesCovered || {}).length || 0,
      alertsCount: state?.alerts?.length || 0,
      alerts: state?.alerts || [],
      logs: logs?.slice(-200) || [],
    };

    const SYSTEM_ENGINE = `
Tu es ChatGPT-5, le cerveau du moteur TINSFLASH.
Analyse uniquement les données issues du moteur, sans extrapoler.
Réponds en français, de manière scientifique et concise.
Indique toujours le niveau de fiabilité (%) et l'état (OK / EN COURS / ERREUR) par étape.
`;

    const prompt = `
[QUESTION]
${message}

[CONTEXTE]
${JSON.stringify(context, null, 2)}

[INSTRUCTIONS]
- Ne pas inventer de données.
- Si information manquante → indique la source en panne.
- Si la question concerne les prévisions → résume les tendances.
`;

    const reply = await askOpenAI(SYSTEM_ENGINE, prompt, { model: "gpt-5" });
    return reply;
  } catch (err) {
    console.error("❌ askAIEngine error:", err.message);
    return "Erreur IA moteur (ChatGPT-5).";
  }
}

/* ===========================================================
   💬 Chat console admin – IA économique (ChatGPT-3.5)
   =========================================================== */
export async function askAIAdmin(message = "", mode = "moteur") {
  try {
    const SYSTEM_ADMIN = `
Tu es un assistant technique ChatGPT-3.5 de la console d’administration TINSFLASH.
Ton rôle : aider Patrick à comprendre l’état du moteur, les prévisions et les alertes.
Parle en français, avec un ton professionnel et précis.
Donne des explications simples, fiables et opérationnelles.
`;

    const prefix =
      mode === "meteo"
        ? "Analyse météo / climat demandée :"
        : "Demande liée au moteur ou à la console :";

    const prompt = `${prefix}\n${message}`;
    const reply = await askOpenAI(SYSTEM_ADMIN, prompt, { model: "gpt-3.5-turbo" });
    return reply;
  } catch (err) {
    console.error("❌ askAIAdmin error:", err.message);
    return "Erreur IA admin (ChatGPT-3.5).";
  }
}

/* ===========================================================
   💬 Chat public (utilisateurs gratuits – Cohere)
   =========================================================== */
export async function askAIGeneral(message = "") {
  try {
    const { reply } = await askCohere(message);
    return reply || "Réponse IA indisponible (Cohere).";
  } catch (err) {
    console.error("❌ askAIGeneral error:", err.message);
    return "Erreur IA publique (Cohere).";
  }
}

export default {
  askAIEngine,
  askAIAdmin,
  askAIGeneral,
};
