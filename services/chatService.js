// services/chatService.js
import cohere from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();
cohere.init(process.env.COHERE_API_KEY);

// === Chat avec J.E.A.N. (IA météo nucléaire) ===
async function chatWithJean(message) {
  if (!message || !message.trim()) {
    return { reply: "⚠️ Message vide. Reformule ta question." };
  }

  try {
    const response = await cohere.chat({
      model: "command-r-03-202",   // ✅ modèle actif Cohere
      messages: [
        { role: "user", content: message }
      ]
    });

    // ✅ Récupération sécurisée du texte
    const reply =
      response.text ||
      response.message?.content ||
      "❌ Pas de réponse IA";

    return { reply };
  } catch (err) {
    console.error("❌ Erreur chat JEAN:", err.message);
    return { reply: `❌ Erreur IA: ${err.message}` };
  }
}

export default { chatWithJean };
