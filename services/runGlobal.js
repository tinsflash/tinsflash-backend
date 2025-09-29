// services/runGlobal.js
// 🌍 RUN GLOBAL – Europe + USA

import { askOpenAI } from "./openaiService.js";
import { addLog, addError } from "./adminLogs.js";
import { getEngineState, saveEngineState } from "./engineState.js";
import { addAlert, processAlerts } from "./alertsService.js";

export async function runGlobal(zone = "Europe") {
  const state = getEngineState();
  try {
    await addLog("🌍 Lancement du RUN GLOBAL…");

    state.runTime = new Date().toISOString();
    state.checkup.global = "PENDING";
    saveEngineState(state);

    const prompts = {
      Europe: `
Analyse météo RUN GLOBAL – EUROPE
Objectif: détecter anomalies majeures (tempête, chaleur, inondations…).
Réponds en JSON strict:
{ 
  continent: "Europe",
  type: "string",
  reliability: 0-100,
  firstDetector: true/false,
  details: {
    start: "ISO date",
    end: "ISO date",
    zones: ["liste des zones touchées"],
    intensity: "valeurs précises (vent, pluie, températures…)",
    consequences: ["liste"],
    recommendations: ["liste"]
  }
}
`,
      USA: `
Analyse météo RUN GLOBAL – USA
Objectif: anomalies majeures par État.
Réponds en JSON strict:
{ 
  country: "USA",
  type: "string",
  reliability: 0-100,
  firstDetector: true/false,
  details: {
    start: "ISO date",
    end: "ISO date",
    zones: ["États touchés"],
    intensity: "valeurs précises (vent, pluie, températures…)",
    consequences: ["liste"],
    recommendations: ["liste"]
  }
}
`,
    };

    const results = {};

    for (const [key, prompt] of Object.entries(prompts)) {
      try {
        const raw = await askOpenAI(prompt);
        const parsed = JSON.parse(raw);
        results[key] = parsed;

        await addAlert(parsed); // Ajout direct en base d’alertes
        await addLog(`✅ Alerte RUN GLOBAL (${key}): ${parsed.type}, ${parsed.reliability}%`);
      } catch (err) {
        await addError(`Erreur RUN GLOBAL ${key}: ${err.message}`);
      }
    }

    const alertStats = await processAlerts();
    state.checkup.global = alertStats.error ? "FAIL" : "OK";
    saveEngineState(state);

    await addLog("✅ RUN GLOBAL terminé");
    return results;
  } catch (err) {
    state.checkup.global = "FAIL";
    saveEngineState(state);
    await addError("❌ Erreur RUN GLOBAL: " + err.message);
    return { error: err.message };
  }
}
