// services/chatService.js
import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function chatWithJean(message) {
  try {
    const cleaned = (message || "").trim();
    if (cleaned.length < 2) {
      return { reply: "⚠️ Pose une vraie question météo (au moins 2 caractères)." };
    }

    const response = await cohere.chat({
      model: "command-r-03-202",   // ✅ modèle actif
      message: cleaned,            // ✅ clé correcte (PAS 'messages')
    });

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
