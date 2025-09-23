// services/chatService.js
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";

dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // ta clé API Cohere
});

/**
 * Fonction pour discuter avec J.E.A.N.
 * @param {string} userMessage - Le message envoyé par l'utilisateur/admin
 */
async function chatWithJean(userMessage) {
  try {
    // ✅ Appel API Cohere Chat (syntaxe correcte)
    const response = await cohere.chat({
      model: "command-r-plus",
      message: userMessage, // ⚡ pas "messages[]", juste "message"
    });

    // ✅ Extraction réponse texte
    let reply = "❌ Pas de réponse de J.E.A.N.";
    if (response?.text) {
      reply = response.text;
    } else if (response?.output_text) {
      reply = response.output_text;
    }

    return { text: reply };
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err.message);
    return { text: `❌ Erreur IA Cohere: ${err.message}` };
  }
}

export default chatWithJean;
