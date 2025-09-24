// services/chatService.js
import { CohereClient } from "cohere-ai";
import { addLog } from "./logsService.js";

// ✅ Initialisation correcte Cohere v7+
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Chat IA avec J.E.A.N.
 * @param {string} message - question de l'admin
 * @returns {Promise<string>} réponse IA
 */
export async function chatWithJean(message) {
  try {
    await addLog(`💬 Question envoyée à J.E.A.N.: ${message}`);

    const response = await cohere.chat({
      model: "command-r-plus",
      messages: [
        { role: "system", content: "Tu es J.E.A.N., une IA météorologique experte qui analyse les modèles climatiques et météorologiques mondiaux avec la précision d'une centrale nucléaire météo." },
        { role: "user", content: message }
      ],
    });

    const reply =
      response?.text ||
      response?.message?.content?.[0]?.text ||
      "⚠️ Réponse IA indisponible";

    await addLog(`🤖 Réponse J.E.A.N.: ${reply}`);

    return reply;
  } catch (err) {
    console.error("❌ Erreur chatWithJean:", err.message);
    await addLog("❌ Erreur chatWithJean: " + err.message);
    return "❌ J.E.A.N. est momentanément indisponible.";
  }
}

export default { chatWithJean };
