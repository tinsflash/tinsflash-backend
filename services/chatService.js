// services/chatService.js
import { getEngineState } from "./engineState.js";
import forecastService from "./forecastService.js";
import { askAI } from "./aiService.js";

// Chat général
export async function askAIChat(message) {
  return await askAI(message);
}

// Chat moteur
export async function askAIEngine(message) {
  try {
    const state = getEngineState();
    const prompt = `
Tu es ChatGPT5 intégré à TINSFLASH.
Analyse et explique les résultats moteur ci-dessous.

Run : ${state.runTime}
Zones OK : ${Object.keys(state.zonesCovered||{}).filter(z=>state.zonesCovered[z]).join(", ")}
Zones KO : ${Object.keys(state.zonesCovered||{}).filter(z=>!state.zonesCovered[z]).join(", ")}
Sources : ${JSON.stringify(state.sources||{},null,2)}
Alertes : ${JSON.stringify(state.alertsList||[],null,2)}
Logs : ${(state.logs||[]).map(l=>l.message).join(" | ")}
Erreurs : ${JSON.stringify(state.errors||[],null,2)}

Question admin :
"${message}"

Règles : <70% ignorées, 70–90% en attente, >90% publiées auto.
Réponds clair et structuré en français.
`;
    return await askAI(prompt);
  } catch(err) {
    return { error: err.message };
  }
}

export default { askAIChat, askAIEngine };
