// PATH: services/chatService.js
import { askOpenAI } from "./openaiService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";

const SYSTEM_GENERAL = `
Tu es ChatGPT5 intégré à la Centrale Nucléaire Météo.
Réponds en français, précisément, en t’appuyant d'abord sur nos résultats (prévisions et alertes du moteur).
`;

const SYSTEM_ENGINE = `
Tu es l'expert "technicien moteur" + "météorologue" de la Centrale.
Tu disposes de l'état moteur, des logs et des sorties IA (prévisions/alertes).
Réponds de façon opérationnelle, concise, factuelle.
`;

// Chat IA général
export async function askAI(message = "") {
  const prompt = `Question:\n${message}\n\nContexte: reste factuel.`;
  const reply = await askOpenAI(SYSTEM_GENERAL, prompt);
  return reply;
}

// Chat IA moteur
export async function askAIEngine(message = "") {
  // ⚡ IMPORTANT : on attend bien le state
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

  const prompt = `
[QUESTION UTILISATEUR]
${message}

[CONTEXTE MOTEUR]
${JSON.stringify(context, null, 2)}

[INSTRUCTIONS]
- Si la question concerne l’état du run → réponds avec un statut clair (OK / PENDING / FAIL) étape par étape.
- Si on demande des prévisions ou alertes → synthétise avec fiabilité (%), intensité et durée.
- Mentionne si des données manquent (sources externes down, etc).
- Ne pas inventer, rester factuel basé sur CONTEXTE.
`;

  const reply = await askOpenAI(SYSTEM_ENGINE, prompt);
  return reply;
}
