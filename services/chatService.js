// services/chatService.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";

// Initialisation Cohere
const cohere = CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Service de chat IA J.E.A.N.
 * - Dialogue direct depuis l’interface utilisateur
 * - Réponse rapide (moins technique que superForecast)
 */
async function askJEAN(userMessage) {
  try {
    await addLog(`💬 Chat utilisateur → J.E.A.N.: ${userMessage}`);

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        { role: "user", content: userMessage }
      ]
    });

    let reply =
      response.message?.content?.[0]?.text ||
      response.text ||
      "⚠️ Réponse IA vide ou non reconnue";

    await addLog(`🤖 Réponse J.E.A.N. (chat): ${reply}`);

    return reply;
  } catch (err) {
    console.error("❌ Erreur chat JEAN:", err.message);
    await addLog("❌ Erreur chat JEAN: " + err.message);
    return "⚠️ JEAN indisponible (erreur IA).";
  }
}

export default { askJEAN };
