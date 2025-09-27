// services/aiRouter.js
import { askAI } from "./aiService.js";
import { getEngineState } from "./engineState.js";

/**
 * Diagnostic complet moteur
 */
export async function askAIDiagnostic() {
  const state = getEngineState();
  const prompt = `
Analyse en profondeur du moteur météo TINSFLASH :
- runTime : ${state.runTime}
- Zones couvertes : ${JSON.stringify(state.zonesCovered || {})}
- Erreurs : ${JSON.stringify(state.errors || [])}

Fais un check complet : ingestion, intégrité, alertes, fiabilité.
  `;
  return askAI(prompt, { context: "diagnostic" });
}

/**
 * Prévisions par ville
 */
export async function askAIForecast(city, country) {
  const prompt = `Donne les prévisions cockpit TINSFLASH pour ${city}, ${country}.
Respecte les règles : données moteur uniquement, jamais inventer.`;
  return askAI(prompt, { context: "forecast" });
}

export default { askAIDiagnostic, askAIForecast };
