// services/chatService.js
import { askAI } from "./aiService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";
import { getActiveAlerts } from "./alertsService.js";

/**
 * Chat IA cockpit relié au moteur nucléaire météo TINSFLASH
 */
export async function askAIChat(message) {
  try {
    const state = getEngineState();
    const logs = getLogs().slice(0, 10);
    const alerts = await getActiveAlerts();

    const prompt = `
Données moteur :
- runTime : ${state.runTime || "donnée indisponible"}
- Zones OK : ${Object.keys(state.zonesCovered || {}).filter(z => state.zonesCovered[z])}
- Zones KO : ${Object.keys(state.zonesCovered || {}).filter(z => !state.zonesCovered[z])}
- Erreurs : ${JSON.stringify(state.errors || [])}
- Logs récents : ${logs.map(l => l.message).join(" | ")}
- Alertes actives (${alerts.length}) : ${alerts.map(a => `${a.zone} fiabilité ${a.score}%`).join(" | ")}

Question admin : "${message}"
    `;

    const result = await askAI(prompt, { context: "cockpit" });
    return result.reply;
  } catch (err) {
    console.error("❌ Erreur Chat cockpit:", err);
    return "Erreur IA cockpit : " + err.message;
  }
}

export default { askAIChat };
