// services/chatService.js
import pkg from "cohere-ai";
import { addLog } from "./logsService.js";

const { CohereClient } = pkg;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Service Chat IA – dialogue direct avec J.E.A.N.
 */
async function askJEAN(userMessage) {
  try {
    await addLog(`💬 Chat utilisateur → J.E.A.N.: ${userMessage}`);

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [{ role: "user", content: userMessage }],
    });

    const reply =
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
