// services/chatService.js
import { askAI } from "./aiService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";
import { getActiveAlerts } from "./alertsService.js";

/**
 * Chat IA cockpit relié au moteur nucléaire météo TINSFLASH
 * Double rôle :
 * 1. Analyse runs, prévisions, alertes (zones couvertes + non couvertes)
 * 2. Répond aux questions admin sur moteur/console
 */
export async function askAIChat(message) {
  try {
    // Récupération état moteur + logs + alertes
    const state = getEngineState();
    const logs = getLogs().slice(0, 10);
    const alerts = await getActiveAlerts();

    // Construit un contexte riche pour GPT-5
    const prompt = `
Tu es l'IA cockpit de la Centrale Nucléaire Météo TINSFLASH.
Rappel : tu es ChatGPT-5, rôle = météorologue + climatologue + codeur + mathématicien.

Données moteur :
- runTime : ${state.runTime}
- Zones couvertes OK : ${Object.keys(state.zonesCovered || {}).filter(z => state.zonesCovered[z])}
- Zones KO : ${Object.keys(state.zonesCovered || {}).filter(z => !state.zonesCovered[z])}
- Erreurs : ${JSON.stringify(state.errors || [])}
- Logs récents : ${logs.map(l => l.message).join(" | ")}
- Alertes actives (${alerts.length}) : ${alerts.map(a => `${a.zone} fiabilité ${a.score}%`).join(" | ")}

Règles :
- Si info absente → réponds "donnée indisponible".
- Zones couvertes : prévisions locales + nationales, alertes locales/nationales.
- Zones non couvertes : alertes continentales uniquement.
- Alertes mondiales = nationales + continentales.
- Fiabilité >90% = publiées auto (signale si nous sommes premiers).
- Fiabilité 70–90% = en attente de validation console.
- Fiabilité <70% = ignorées.
- Jamais inventer de données.

Question posée par admin : "${message}"
    `;

    const result = await askAI(prompt, { context: "cockpit" });
    return result.reply;
  } catch (err) {
    console.error("❌ Erreur Chat cockpit:", err);
    return "Erreur IA cockpit : " + err.message;
  }
}

export default { askAIChat };
