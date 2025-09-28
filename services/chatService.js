// PATH: services/chatService.js
// Chat IA (général) + Chat IA moteur — sans passer de paramètres non supportés

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
Réponds de façon opérationnelle et concise.
`;

// Chat IA général (page publique ou utilitaire)
export async function askAI(message = "") {
  const prompt = `Question:\n${message}\n\nContexte: reste factuel.`;
  // ⚠️ On n’envoie AUCUN réglage (temp/max_tokens), openaiService gère la compat.
  const reply = await askOpenAI(SYSTEM_GENERAL, prompt);
  return reply;
}

// Chat IA “moteur” (console admin)
export async function askAIEngine(message = "") {
  const state = getEngineState();
  const logs = await getLogs();

  const context = {
    checkup: state?.checkup || {},
    lastRun: state?.runTime,
    zonesCovered: Object.keys(state?.zonesCovered || {}).length || 0,
    alerts: state?.alerts || [],
    logs: logs?.slice(-200) || [],
  };

  const prompt = `
[QUESTION]
${message}

[CONTEXTE]
${JSON.stringify(context, null, 2)}

[INSTRUCTIONS]
- Si la question concerne l’état du run, réponds avec un statut clair (OK/PENDING/FAIL) par point.
- Si on demande une explication d’alerte/prévision, synthétise et précise l’incertitude.
- Pas d'invention. Base-toi sur les données fournies.
`;

  const reply = await askOpenAI(SYSTEM_ENGINE, prompt);
  return reply;
}
