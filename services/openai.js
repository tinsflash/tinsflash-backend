// services/openai.js (corrigé → Cohere)
import coherePkg from "cohere-ai";

const { CohereClient } = coherePkg;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Envoie une requête à JEAN (Cohere) pour le chat météo.
 * @param {string} prompt - Texte de l’utilisateur
 * @returns {Promise<string>} - Réponse de JEAN
 */
export async function askJean(prompt) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        { role: "system", content: "Tu es J.E.A.N., une IA spécialisée en météo." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    if (response.text) {
      return response.text;
    } else if (response.message?.content?.[0]?.text) {
      return response.message.content[0].text;
    }
    return "⚠️ Réponse IA vide ou non reconnue.";
  } catch (err) {
    console.error("❌ Erreur JEAN (Cohere):", err.message);
    return "⚠️ JEAN n’est pas disponible pour le moment.";
  }
}
