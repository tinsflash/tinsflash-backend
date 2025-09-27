// services/chatService.js
import { runGlobal } from "./runGlobal.js";
import { runContinental } from "./runContinental.js";
import { getActiveAlerts, getPendingAlerts } from "./alertsService.js";
import { getEngineState } from "./engineState.js";
import { askOpenAI } from "./openaiService.js";

/**
 * Chat IA principal (console admin)
 * Répond aux questions générales : météo, moteur, comparaisons, explications.
 */
export async function askAI(message) {
  try {
    // Récupération de l’état moteur
    const state = getEngineState();

    // Prompt enrichi pour ChatGPT-5
    const prompt = `
Tu es ChatGPT-5, expert météorologue, climatologue, codeur et mathématicien.
Voici l'état actuel du moteur météo TINSFLASH :
${JSON.stringify(state, null, 2)}

Question de l’administrateur :
"${message}"

Réponds avec précision professionnelle, style expert NASA/EMA, sans approximation.
    `;

    const reply = await askOpenAI(prompt);
    return reply;
  } catch (err) {
    return `❌ Erreur ChatService.askAI: ${err.message}`;
  }
}

/**
 * Chat IA orienté moteur météo
 * Répond sur les runs, prévisions et alertes détectées.
 */
export async function askAIEngine(message) {
  try {
    const state = getEngineState();
    const active = getActiveAlerts();
    const pending = getPendingAlerts();

    const prompt = `
Tu es ChatGPT-5 branché sur la centrale nucléaire météo TINSFLASH.
Voici l’état du moteur et des alertes :
État moteur : ${JSON.stringify(state, null, 2)}
Alertes validées : ${JSON.stringify(active, null, 2)}
Alertes en attente : ${JSON.stringify(pending, null, 2)}

Message reçu : "${message}"

Analyse et réponds comme un expert en météorologie opérationnelle.
Donne des explications claires et fiables, prêtes à être transmises aux autorités.
    `;

    const reply = await askOpenAI(prompt);
    return reply;
  } catch (err) {
    return `❌ Erreur ChatService.askAIEngine: ${err.message}`;
  }
}
