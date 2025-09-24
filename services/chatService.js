// services/chatService.js
import cohere from "cohere-ai";

cohere.init(process.env.COHERE_API_KEY);

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
      reply = response.text; // Anciennes versions SDK
    } else if (response.message?.content) {
      reply = response.message.content[0].text; // Nouvelles versions SDK
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
