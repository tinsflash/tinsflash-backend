// PATH: services/chatService.js
// Chat IA – Centrale Nucléaire Météo TINSFLASH
// Double rôle :
// 1. Console admin (questions générales sur le moteur + météo)
// 2. Analyse moteur (runs, alertes, prévisions détaillées)

import OpenAI from "openai";
import { getEngineState } from "./engineState.js";

// === Initialisation client OpenAI ===
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ⚠️ clé API dans Render
});

// === Prompt système commun ===
const SYSTEM_PROMPT = `
Tu es ChatGPT-5, intégré à la Centrale Nucléaire Météo TINSFLASH.

Règles :
- Toujours analyser à partir des résultats du moteur (engineState).
- Zones couvertes : produire prévisions locales et nationales très précises (relief, climat, altitude, environnement).
- Zones non couvertes : produire uniquement alertes continentales.
- Ne jamais inventer de données : si manquantes → dire "donnée indisponible".
- Indiquer fiabilité (en %) et si TINSFLASH est premier détecteur.
- Comparer aux autres modèles seulement pour valider, jamais comme source principale.
- Style clair, structuré, professionnel, type bulletin météo NASA.
`;

// === Fonction générique IA ===
async function queryAI(prompt, state) {
  const fullPrompt = `
${SYSTEM_PROMPT}

État moteur actuel :
${JSON.stringify(state, null, 2)}

Question / consigne :
${prompt}
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5", // ⚡ forcé ChatGPT-5
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.2,
      // ❌ plus de max_tokens ici → bug corrigé
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    return `❌ Erreur ChatGPT-5: ${err.message}`;
  }
}

// === Fonctions exportées ===

// IA console admin (questions générales)
export async function askAI(message) {
  const state = getEngineState();
  return await queryAI(message, state);
}

// IA moteur (analyse runs + alertes + sources + erreurs)
export async function askAIEngine(message) {
  const state = getEngineState();
  const extra = `
Analyse approfondie côté moteur :
- Logs : ${JSON.stringify(state.logs || [], null, 2)}
- Alertes : ${JSON.stringify(state.alertsList || [], null, 2)}
- Sources : ${JSON.stringify(state.sources || [], null, 2)}
- Erreurs : ${JSON.stringify(state.errors || [], null, 2)}
`;
  return await queryAI(message + extra, state);
}

export default { askAI, askAIEngine };
