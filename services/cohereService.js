// services/cohereService.js
// 🎯 IA Cohere dédiée à J.E.A.N. (Index public uniquement)

import fetch from "node-fetch";

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_URL = "https://api.cohere.ai/v1/chat";

/**
 * Pose une question météo simple à J.E.A.N. (Cohere)
 * @param {string} question - La question de l'utilisateur
 * @param {string} category - Contexte ("grand public", par défaut)
 * @returns {Promise<string>}
 */
export async function askCohere(question, category = "grand public") {
  try {
    if (!COHERE_API_KEY) {
      throw new Error("❌ COHERE_API_KEY manquant dans .env");
    }

    const response = await fetch(COHERE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r",   // modèle rapide cohère
        messages: [
          { role: "system", content: `Tu es J.E.A.N., assistant météo grand public. Catégorie: ${category}. Sois concis et clair.` },
          { role: "user", content: question }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Nouveau format Cohere : data.output.text
    const reply = data?.text || data?.output?.text || "❌ Pas de réponse de J.E.A.N.";
    return reply;
  } catch (err) {
    console.error("⚠️ Cohere error:", err.message);
    return `Erreur J.E.A.N.: ${err.message}`;
  }
}
