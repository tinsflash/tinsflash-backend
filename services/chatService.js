// src/services/chatService.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function chatWithJean(message) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus", // moteur le plus performant gratuit
      message: message,
    });

    // ✅ Correction : Cohere renvoie souvent response.text ou response.output_text
    const text =
      response.text || response.output_text || "⚠️ Réponse vide de Cohere";

    return { text };
  } catch (err) {
    console.error("❌ Erreur Cohere:", err.message);
    return { text: "❌ Erreur IA: " + err.message };
  }
}

export default { chatWithJean };
