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
    // ✅ Appel API Cohere Chat (nouvelle syntaxe = messages[])
    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // ✅ Extraction réponse texte (robuste selon différents formats possibles)
    let reply = "❌ Pas de réponse de J.E.A.N.";
    if (response?.message?.content?.[0]?.text) {
      reply = response.message.content[0].text;
    } else if (response?.text) {
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
