// PATH: services/aiService.js
// Couche unique IA (Cohere maintenant, GPT-5 demain)

import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  apiKey: process.env.COHERE_API_KEY,
});

// Prompt système partagé
const SYSTEM_PROMPT = `
Tu es J.E.A.N., une IA météorologique experte.
- Langue: français clair et concis.
- Précision: ajoute probabilités/incertitudes.
- Priorité: Europe (UE27 + UK + UA) et USA.
- Pas d’invention de données d’observation en temps réel.
`;

/**
 * Appel IA unifié
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function askAI(message) {
  if (!process.env.COHERE_API_KEY) {
    return "⚠️ IA indisponible (clé COHERE_API_KEY manquante).";
  }
  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      max_output_tokens: 600,
      temperature: 0.3,
    });

    return (
      (response?.message?.content ?? [])
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("\n")
        .trim() || "⚠️ Pas de réponse générée."
    );
  } catch (err) {
    console.error("❌ Erreur askAI:", err);
    return "⚠️ Erreur IA (service indisponible).";
  }
}
