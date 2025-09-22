// services/openai.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // clé stockée dans Render
});

/**
 * Envoie une requête à GPT pour le chat J.E.A.N.
 * @param {string} prompt - Texte de l’utilisateur
 * @returns {Promise<string>} - Réponse de l’IA
 */
export async function askJean(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // modèle rapide & économique
      messages: [
        { role: "system", content: "Tu es J.E.A.N., une IA spécialisée en météo." },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("Erreur OpenAI:", err.message);
    return "⚠️ JEAN n’est pas disponible pour le moment.";
  }
}
