// services/chatService.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function askJEAN(userMessage) {
  try {
    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        { role: "user", content: userMessage }
      ]
    });

    let reply;
    if (response.text) {
      reply = response.text; // Ancienne compatibilité
    } else if (response.message?.content?.[0]?.text) {
      reply = response.message.content[0].text; // Format nouveau SDK
    } else {
      reply = "⚠️ Réponse IA vide ou non reconnue";
    }

    return reply;
  } catch (err) {
    console.error("❌ Erreur IA JEAN :", err.message);
    return "⚠️ JEAN indisponible, erreur IA.";
  }
}

export default { askJEAN };
