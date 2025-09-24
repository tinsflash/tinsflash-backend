// services/chatService.js
import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

// ✅ Nouveau client Cohere
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// === Chat avec J.E.A.N. ===
async function chatWithJean(message) {
  if (!message || !message.trim()) {
    return { reply: "⚠️ Message vide. Reformule ta question." };
  }

  try {
    const response = await cohere.chat({
      model: "command-r-03-202",   // ✅ modèle actif
      messages: [
        { role: "user", content: message }
      ]
    });

    // ✅ Cohere renvoie ici
    const reply =
      response.message?.content?.[0]?.text ||
      response.text ||
      "❌ Pas de réponse IA";

    return { reply };
  } catch (err) {
    console.error("❌ Erreur chat JEAN:", err.message);
    return { reply: `❌ Erreur IA: ${err.message}` };
  }
}

export default { chatWithJean };
