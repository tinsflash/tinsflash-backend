// src/services/chatService.js
import { CohereClient } from "cohere-ai";
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

export async function askJean(message) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        { role: "system", content: "Tu es J.E.A.N., expert météo nucléaire mondial." },
        { role: "user", content: message },
      ],
    });

    return response.message?.content[0]?.text || "⚠️ Pas de réponse IA.";
  } catch (err) {
    return `❌ Erreur IA Cohere: ${err.message}`;
  }
}
