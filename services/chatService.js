// services/chatService.js
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";

dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // clé API Cohere
});

/**
 * Fonction pour discuter avec J.E.A.N.
 * @param {string} userMessage - Le message envoyé par l'utilisateur/admin
 */
async function chatWithJean(userMessage) {
  try {
    // ✅ Appel API Cohere (syntaxe correcte : message au singulier)
    const response = await cohere.chat({
      model: "command-r-plus",
      message: userMessage,
    });

    // ✅ Extraction robuste de la réponse
    let reply = "❌ Pas de réponse de J.E.A.N.";
    if (response?.text) {
      reply = response.text;
    } else if (response?.output_text) {
      reply = response.output_text;
    } else if (response?.generations?.[0]?.text) {
      reply = response.generations[0].text;
    } else if (response?.message?.content?.[0]?.text) {
      reply = response.message.content[0].text;
    }

    return { text: reply };
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err);
    return { text: `❌ Erreur IA Cohere: ${err.message}` };
  }
}

export default chatWithJean;
