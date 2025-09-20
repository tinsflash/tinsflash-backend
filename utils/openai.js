// utils/openai.js
import axios from "axios";

const OPENAI_KEY = process.env.OPENAI_KEY || "demo";

/**
 * Envoie une requête à l'API OpenAI pour analyse IA
 * @param {string} prompt - Question ou données météo à analyser
 * @returns {Promise<string>} - Réponse IA (texte brut)
 */
export async function askOpenAI(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      },
      { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    return `Erreur OpenAI: ${err.message}`;
  }
}
